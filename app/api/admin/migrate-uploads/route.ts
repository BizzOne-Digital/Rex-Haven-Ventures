import { connectToDatabase, syncIndexes } from "@/lib/db/mongoose";
import { Media, type MediaDocument } from "@/lib/db/models/Media";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";
import { revalidateBlog } from "@/lib/post-payload";
import { storeUpload } from "@/lib/uploads";
import { MEDIA_FOLDER, readImageSize } from "@/lib/media";
import { MAX_UPLOAD_BYTES, formatBytes, isAllowedUploadType } from "@/lib/upload-types";

/**
 * POST /api/admin/migrate-uploads — pull Cloudinary-hosted images into MongoDB.
 *
 * Cloudinary support was removed; this is the one-shot bridge for an
 * installation that used it. For each media record still pointing at a remote
 * Cloudinary URL it downloads the asset, stores the bytes as a `StoredUpload`,
 * repoints the record at `/api/uploads/...`, and rewrites every blog post that
 * referenced the old URL as its featured image.
 *
 * Safe to run more than once: records already on `mongo` are skipped, and a
 * record whose download fails is left exactly as it was and reported back, so a
 * partial run can simply be repeated.
 *
 * The Cloudinary assets themselves are not deleted — this codebase no longer
 * holds the API secret needed to do that, and leaving them lets you verify the
 * migration before tearing the account down.
 */

export const runtime = "nodejs";
// Downloading a library of images is well past the default budget.
export const maxDuration = 300;

const CLOUDINARY_HOST = "res.cloudinary.com";

function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(CLOUDINARY_HOST);
  } catch {
    return false;
  }
}

export async function POST() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await connectToDatabase();
    await syncIndexes();

    const candidates = await Media.find({
      $or: [{ provider: "cloudinary" }, { url: new RegExp(`^https://${CLOUDINARY_HOST}/`) }],
    }).lean<MediaDocument[]>();

    const migrated: { id: string; from: string; to: string }[] = [];
    const failed: { id: string; url: string; reason: string }[] = [];
    const touchedSlugs: string[] = [];
    let repointedPosts = 0;

    for (const record of candidates) {
      const id = String(record._id);

      if (record.provider === "mongo" || !isCloudinaryUrl(record.url)) continue;

      try {
        const download = await fetch(record.url, { cache: "no-store" });
        if (!download.ok) {
          failed.push({ id, url: record.url, reason: `HTTP ${download.status}` });
          continue;
        }

        const mimeType =
          download.headers.get("content-type")?.split(";")[0].trim() ?? record.mimeType;

        if (!isAllowedUploadType(mimeType)) {
          failed.push({ id, url: record.url, reason: `Unsupported type ${mimeType}` });
          continue;
        }

        const bytes = Buffer.from(await download.arrayBuffer());
        if (bytes.byteLength > MAX_UPLOAD_BYTES) {
          failed.push({
            id,
            url: record.url,
            reason: `${formatBytes(bytes.byteLength)} exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} limit`,
          });
          continue;
        }

        const stored = await storeUpload(MEDIA_FOLDER, mimeType, bytes);
        const dimensions = readImageSize(bytes);
        const previousUrl = record.url;

        await Media.updateOne(
          { _id: record._id },
          {
            $set: {
              provider: "mongo",
              folder: stored.folder,
              filename: stored.filename,
              mimeType,
              size: stored.size,
              url: stored.url,
              ...(dimensions ?? {}),
            },
            // The Cloudinary asset id means nothing once the bytes are local.
            $unset: { publicId: "" },
          },
        );

        // Anything that referenced the Cloudinary URL has to follow it.
        const affected = await BlogPost.find({ coverImage: previousUrl })
          .select("slug")
          .lean<{ slug: string }[]>();

        if (affected.length > 0) {
          await BlogPost.updateMany(
            { coverImage: previousUrl },
            { $set: { coverImage: stored.url } },
          );
          repointedPosts += affected.length;
          touchedSlugs.push(...affected.map((post) => post.slug));
        }

        migrated.push({ id, from: previousUrl, to: stored.url });
      } catch (error) {
        failed.push({
          id,
          url: record.url,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (migrated.length > 0) revalidateBlog(touchedSlugs);

    return ok({
      ok: true,
      examined: candidates.length,
      migrated: migrated.length,
      repointedPosts,
      failed: failed.length,
      details: { migrated, failed },
    });
  } catch (error) {
    return handleRouteError(error, "admin/migrate-uploads");
  }
}
