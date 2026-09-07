import "server-only";
import { storeUpload, buildUploadUrl } from "@/lib/uploads";
import { connectToDatabase } from "@/lib/db/mongoose";
import { StoredUpload } from "@/lib/db/models/StoredUpload";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_MIME_EXTENSIONS,
  formatBytes,
  isAllowedUploadType,
  isUploadFolder,
  type UploadFolder,
} from "@/lib/upload-types";

/**
 * Image storage for the media library.
 *
 * One back end: MongoDB, via `lib/uploads.ts`. The previous build chose between
 * Cloudinary and `public/uploads` at runtime; both are gone. Cloudinary was an
 * external dependency for something the database already does well at this
 * volume, and the local filesystem does not exist on a serverless host — the
 * bytes either failed to write or vanished at the next deploy.
 *
 * The `Media` collection stays the index over the images (original name, size,
 * dimensions, alt text, who uploaded it); `StoredUpload` holds the bytes, and
 * `/api/uploads/:folder/:filename` serves them.
 */

/** The media library's images are filed here. */
export const MEDIA_FOLDER: UploadFolder = "gallery";

export { MAX_UPLOAD_BYTES, formatBytes };

/** Allowed image types, mapped to the extension we store them under. */
export const ALLOWED_IMAGE_TYPES = UPLOAD_MIME_EXTENSIONS;

export function isAllowedImageType(mimeType: string): boolean {
  return isAllowedUploadType(mimeType);
}

export function readImageSize(
  buffer: Buffer,
): { width: number; height: number } | null {
  // PNG: 8-byte signature, then IHDR with width/height as big-endian uint32.
  if (
    buffer.length > 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // GIF: "GIF" then logical screen width/height as little-endian uint16.
  if (
    buffer.length > 10 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  // JPEG: walk the segment markers to the first Start-Of-Frame.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];

      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 carry the dimensions.
      const isStartOfFrame =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 && // DHT
        marker !== 0xc8 && // JPG extension
        marker !== 0xcc; // DAC

      if (isStartOfFrame) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength <= 0) break;
      offset += 2 + segmentLength;
    }
  }

  // WebP: "RIFF"…"WEBPVP8 " variants. Only the simple lossy header is parsed.
  if (
    buffer.length > 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const format = buffer.toString("ascii", 12, 16);
    if (format === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (format === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  return null;
}

/** Which back end holds an image's bytes. */
export type StorageProvider = "mongo" | "cloudinary" | "local";

export type SavedUpload = {
  provider: StorageProvider;
  folder: UploadFolder;
  filename: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
};

/** Where new uploads go. Constant now that there is only one back end. */
export function getStorageProvider(): StorageProvider {
  return "mongo";
}

/** Stores the bytes and returns the record fields for the Media collection. */
export async function saveUpload(
  _originalName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<SavedUpload> {
  const dimensions = readImageSize(bytes);
  const stored = await storeUpload(MEDIA_FOLDER, mimeType, bytes);

  return {
    provider: "mongo",
    folder: stored.folder,
    filename: stored.filename,
    url: stored.url,
    size: stored.size,
    ...(dimensions ?? {}),
  };
}

/**
 * Deletes the bytes behind a stored image.
 *
 * Dispatches on the record's own provider rather than on the current
 * configuration, because three generations of records coexist:
 *
 *  - `mongo` — the blob is a `StoredUpload` document; remove it.
 *  - `cloudinary` — the asset lives in an account this codebase no longer talks
 *    to. Dropping the index row is all we can do; the asset is deleted from the
 *    Cloudinary console, or left to expire with the account.
 *  - `local` (and records predating the field) — the file was on a filesystem
 *    that no longer exists. Nothing to remove.
 *
 * Never throws for a missing blob: the index row is what the library lists, and
 * bytes that are already gone must not block removing the row pointing at them.
 */
export async function deleteUpload(stored: {
  filename: string;
  provider?: StorageProvider;
  folder?: string;
  url?: string;
}): Promise<void> {
  if (stored.provider && stored.provider !== "mongo") return;

  const folder = isUploadFolder(stored.folder) ? stored.folder : MEDIA_FOLDER;

  await connectToDatabase();
  await StoredUpload.deleteOne({ folder, filename: stored.filename });
}

/** The public URL for a stored media record. */
export function mediaUrl(folder: UploadFolder, filename: string): string {
  return buildUploadUrl(folder, filename);
}
