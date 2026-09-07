import "server-only";
import { randomBytes } from "node:crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { StoredUpload } from "@/lib/db/models/StoredUpload";
import {
  UPLOAD_MIME_EXTENSIONS,
  UPLOAD_URL_PREFIX,
  parseStoredUploadUrl,
  type UploadFolder,
} from "@/lib/upload-types";

/**
 * Server-side upload storage.
 *
 * Every image is a document in the `StoredUpload` collection and is served back
 * through `/api/uploads/:folder/:filename`. Nothing is written to disk: the
 * production host has a read-only filesystem, and anything it did let us write
 * would disappear on the next deploy.
 *
 * Documents that reference an image (a blog post's cover, a service's panel)
 * store only that URL string — never the bytes a second time. `deleteUploadByUrl`
 * is the inverse, so replacing or clearing an image doesn't leave the blob
 * behind.
 */

/**
 * A unique, unguessable, traversal-proof filename.
 *
 * The client's own filename never contributes: it is the one part of an upload
 * an attacker fully controls, and none of it is needed once the original name
 * is recorded separately in the media index.
 */
export function buildUploadFilename(mimeType: string): string {
  const extension = UPLOAD_MIME_EXTENSIONS[mimeType] ?? "bin";
  return `${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
}

export function buildUploadUrl(folder: UploadFolder, filename: string): string {
  return `${UPLOAD_URL_PREFIX}/${folder}/${filename}`;
}

export type StoredUploadResult = {
  folder: UploadFolder;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
};

/** Writes the bytes and returns the URL to persist on the owning document. */
export async function storeUpload(
  folder: UploadFolder,
  mimeType: string,
  bytes: Buffer,
): Promise<StoredUploadResult> {
  await connectToDatabase();

  const filename = buildUploadFilename(mimeType);

  await StoredUpload.create({
    folder,
    filename,
    mimeType,
    size: bytes.byteLength,
    data: bytes,
  });

  return {
    folder,
    filename,
    url: buildUploadUrl(folder, filename),
    size: bytes.byteLength,
    mimeType,
  };
}

/**
 * Deletes the blob a URL points at.
 *
 * Returns `true` only when a document was actually removed. A URL that isn't
 * one of ours — an external image, a legacy `/uploads/...` path, an empty
 * string — is a no-op rather than an error: callers use this while replacing an
 * image, and a foreign URL simply has no blob of ours to clean up.
 */
export async function deleteUploadByUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;

  const target = parseStoredUploadUrl(url);
  if (!target) return false;

  await connectToDatabase();
  const result = await StoredUpload.deleteOne(target);
  return (result.deletedCount ?? 0) > 0;
}

/**
 * Deletes the old blob when an image field changes value.
 *
 * Deliberately forgiving: a failed cleanup must not fail the save that prompted
 * it, or an operator would be unable to correct a bad image. The orphan is
 * logged and the write proceeds.
 */
export async function replaceUploadUrl(
  previous: string | null | undefined,
  next: string | null | undefined,
): Promise<void> {
  if (!previous || previous === next) return;
  try {
    await deleteUploadByUrl(previous);
  } catch (error) {
    console.error("[uploads] could not remove the replaced image:", error);
  }
}
