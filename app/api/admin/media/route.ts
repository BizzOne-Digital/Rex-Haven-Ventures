import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Media, type MediaDocument } from "@/lib/db/models/Media";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, requireAdmin } from "@/lib/api";
import { toMediaItem } from "@/lib/media-view";
import { sanitizeText } from "@/lib/sanitize";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  formatBytes,
  isAllowedImageType,
  saveUpload,
} from "@/lib/media";

/**
 * Media library.
 *
 *   GET  /api/admin/media — list uploads, newest first
 *   POST /api/admin/media — upload an image (multipart/form-data, field "file")
 *
 * Admin-only in both directions: the library lists images attached to unpublished
 * drafts, and upload is a write to the server's filesystem.
 */

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));

  try {
    await connectToDatabase();

    const items = await Media.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<MediaDocument[]>();

    // Resolve usage in one grouped query so the library can warn before a
    // delete that would break a post's featured image.
    const urls = items.map((item) => item.url);
    const grouped = await BlogPost.aggregate<{ _id: string; count: number }>([
      { $match: { coverImage: { $in: urls } } },
      { $group: { _id: "$coverImage", count: { $sum: 1 } } },
    ]);
    const usage = new Map(grouped.map((row) => [row._id, row.count]));

    const totalBytes = items.reduce((sum, item) => sum + item.size, 0);

    return ok({
      items: items.map((item) => toMediaItem(item, usage.get(item.url) ?? 0)),
      total: items.length,
      totalBytes,
      totalSize: formatBytes(totalBytes),
      limits: {
        maxBytes: MAX_UPLOAD_BYTES,
        maxSize: formatBytes(MAX_UPLOAD_BYTES),
        acceptedTypes: Object.keys(ALLOWED_IMAGE_TYPES),
      },
    });
  } catch (error) {
    return handleRouteError(error, "admin/media/list");
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errors.badRequest("Expected a multipart/form-data upload.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return errors.validation({ file: "Please choose an image to upload." });
  }

  if (!isAllowedImageType(file.type)) {
    return errors.validation({
      file: `That file type isn't supported. Accepted: ${Object.keys(ALLOWED_IMAGE_TYPES)
        .map((type) => type.replace("image/", "."))
        .join(", ")}.`,
    });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return errors.validation({
      file: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    });
  }

  const alt = sanitizeText(String(formData.get("alt") ?? "")).slice(0, 300);

  try {
    await connectToDatabase();

    const bytes = Buffer.from(await file.arrayBuffer());
    const saved = await saveUpload(file.name, file.type, bytes);

    const created = await Media.create({
      filename: saved.filename,
      originalName: sanitizeText(file.name).slice(0, 255) || saved.filename,
      mimeType: file.type,
      size: saved.size,
      url: saved.url,
      ...(saved.width ? { width: saved.width } : {}),
      ...(saved.height ? { height: saved.height } : {}),
      ...(alt ? { alt } : {}),
      uploadedBy: new Types.ObjectId(user.id),
    });

    return ok({ ok: true, media: toMediaItem(created, 0) }, 201);
  } catch (error) {
    // A read-only or missing filesystem is the likely cause on serverless hosts.
    if ((error as NodeJS.ErrnoException)?.code === "EROFS") {
      return errors.unconfigured(
        "This host has a read-only filesystem, so local uploads aren't possible. Configure Cloudinary or S3 — see lib/media.ts.",
      );
    }
    return handleRouteError(error, "admin/media/upload");
  }
}
