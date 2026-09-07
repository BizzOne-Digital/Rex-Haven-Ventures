import { errors, handleRouteError, ok, requireAdmin } from "@/lib/api";
import { storeUpload } from "@/lib/uploads";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_MIME_EXTENSIONS,
  formatBytes,
  isAllowedUploadType,
  isUploadFolder,
} from "@/lib/upload-types";

/**
 * POST /api/upload — store one image and hand back its public URL.
 *
 * Body is `multipart/form-data` with two fields:
 *   file    the image itself
 *   folder  one of products | gallery | pages | misc
 *
 * The response is `{ success, url, filename, size, folder }`; the caller saves
 * `url` on whatever document the image belongs to. Bytes go to MongoDB, never
 * to disk — see `lib/uploads.ts` for why.
 *
 * Admin-only: this is an unauthenticated-write surface otherwise, and an open
 * one would let anyone fill the database with arbitrary blobs.
 */

// Buffer work and the Mongo driver both need Node APIs.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errors.badRequest("Expected a multipart/form-data upload.");
  }

  const folder = formData.get("folder");
  if (!isUploadFolder(folder)) {
    return errors.validation({
      folder: "Choose one of: products, gallery, pages, misc.",
    });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return errors.validation({ file: "Please choose an image to upload." });
  }

  if (!isAllowedUploadType(file.type)) {
    return errors.validation({
      file: `That file type isn't supported. Accepted: ${Object.values(UPLOAD_MIME_EXTENSIONS)
        .map((extension) => `.${extension}`)
        .join(", ")}.`,
    });
  }

  // Checked against the declared size first so an oversized file is rejected
  // before it is read into memory.
  if (file.size > MAX_UPLOAD_BYTES) {
    return errors.validation({
      file: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    // And again against what actually arrived, in case the declared size lied.
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return errors.validation({
        file: `That image is ${formatBytes(bytes.byteLength)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      });
    }

    const stored = await storeUpload(folder, file.type, bytes);

    return ok(
      {
        success: true,
        url: stored.url,
        filename: stored.filename,
        size: stored.size,
        folder: stored.folder,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, "upload");
  }
}
