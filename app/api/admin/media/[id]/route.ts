import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Media } from "@/lib/db/models/Media";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { toMediaItem } from "@/lib/media-view";
import { deleteUpload } from "@/lib/media";
import { sanitizeText } from "@/lib/sanitize";

/**
 * A single uploaded image.
 *
 *   PATCH  /api/admin/media/:id — update alt text
 *   DELETE /api/admin/media/:id — delete the record and the file
 *
 * Deletion is refused while a post still uses the image as its featured image,
 * unless `force: true` is passed — the library surfaces the count so the
 * decision is informed rather than a surprise broken image on the live blog.
 */

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that image.");

  const body = await readJson<{ alt?: string }>(request);
  if (!body) return errors.badRequest();

  try {
    await connectToDatabase();
    const media = await Media.findById(id);
    if (!media) return errors.notFound("We couldn't find that image.");

    if (typeof body.alt === "string") {
      const alt = sanitizeText(body.alt).slice(0, 300);
      media.alt = alt || undefined;
    }

    await media.save();
    return ok({ ok: true, media: toMediaItem(media, 0) });
  } catch (error) {
    return handleRouteError(error, "admin/media/update");
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that image.");

  const body = await readJson<{ force?: boolean }>(request);
  const force = body?.force === true;

  try {
    await connectToDatabase();
    const media = await Media.findById(id);
    if (!media) return errors.notFound("We couldn't find that image.");

    const inUse = await BlogPost.countDocuments({ coverImage: media.url });

    if (inUse > 0 && !force) {
      return errors.conflict(
        `${inUse} post${inUse === 1 ? "" : "s"} use this image as the featured image. Replace it there first, or delete anyway.`,
      );
    }

    // Clear the reference before removing the bytes, so no post is left
    // pointing at a URL that 404s.
    if (inUse > 0) {
      await BlogPost.updateMany({ coverImage: media.url }, { $unset: { coverImage: "" } });
    }

    const { filename } = media;
    await media.deleteOne();
    await deleteUpload(filename);

    return ok({ ok: true, clearedFromPosts: inUse });
  } catch (error) {
    return handleRouteError(error, "admin/media/delete");
  }
}
