import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  destroyOnCloudinary,
  getCloudinaryConfig,
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "@/lib/cloudinary";

/**
 * Image storage.
 *
 * Two back ends behind one pair of functions, chosen by configuration rather
 * than by a build flag:
 *
 *   - Cloudinary, whenever `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
 *     `CLOUDINARY_API_SECRET` are all set. This is the one that works on a
 *     serverless host, and the one to use in production.
 *   - The local filesystem (`public/uploads`) otherwise, so a checkout with no
 *     credentials still runs.
 *
 * Every stored image records which back end holds its bytes, so deletes always
 * go to the right place — including for images uploaded before Cloudinary was
 * configured. The `Media` collection stays the index either way.
 *
 * For S3-compatible storage instead, the variables are documented in
 * `.env.example`; it would slot in beside Cloudinary as a third `provider`.
 */

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const UPLOAD_URL_PREFIX = "/uploads";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** Allowed image types, mapped to the extension we store them under. */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function isAllowedImageType(mimeType: string): boolean {
  return mimeType in ALLOWED_IMAGE_TYPES;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Builds a collision-proof, path-traversal-proof stored filename.
 *
 * The original name only contributes a sanitised, truncated stem — it never
 * reaches the filesystem verbatim, so `../../etc/passwd` cannot escape the
 * upload directory.
 */
export function buildFilename(originalName: string, mimeType: string): string {
  const extension = ALLOWED_IMAGE_TYPES[mimeType] ?? "bin";

  const stem = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const stamp = new Date().toISOString().slice(0, 10);
  const nonce = randomBytes(5).toString("hex");

  return `${stamp}-${stem || "image"}-${nonce}.${extension}`;
}

/**
 * Reads intrinsic dimensions straight from the file header.
 *
 * Dependency-free, and covers the formats people actually upload. Anything else
 * (SVG, AVIF) returns nothing — dimensions are optional metadata, so an unknown
 * format is not an error.
 */
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
export type StorageProvider = "cloudinary" | "local";

export type SavedUpload = {
  provider: StorageProvider;
  filename: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  /** Cloudinary's asset identifier. Absent for local files. */
  publicId?: string;
};

/** True when uploads will go to Cloudinary rather than the local filesystem. */
export function getStorageProvider(): StorageProvider {
  return isCloudinaryConfigured() ? "cloudinary" : "local";
}

/**
 * Stores the bytes and returns the record fields for the Media collection.
 *
 * Routes to Cloudinary when it is configured, and to `public/uploads` when it
 * is not. Callers don't branch on the provider — they persist whatever comes
 * back, which is what makes deletion able to find the bytes again later.
 */
export async function saveUpload(
  originalName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<SavedUpload> {
  // Reuse the generated name as the Cloudinary public id too, minus the
  // extension: Cloudinary derives the delivered format itself, and a public id
  // carrying ".jpg" produces URLs ending ".jpg.jpg".
  const filename = buildFilename(originalName, mimeType);
  const dimensions = readImageSize(bytes);

  const cloudinary = getCloudinaryConfig();
  if (cloudinary) {
    const publicId = filename.replace(/\.[^.]+$/, "");
    const uploaded = await uploadToCloudinary(cloudinary, publicId, mimeType, bytes);

    return {
      provider: "cloudinary",
      filename,
      url: uploaded.secureUrl,
      size: uploaded.bytes,
      publicId: uploaded.publicId,
      // Prefer Cloudinary's own dimensions; fall back to the header parse for
      // formats it doesn't report (and so both back ends behave alike).
      ...(uploaded.width && uploaded.height
        ? { width: uploaded.width, height: uploaded.height }
        : (dimensions ?? {})),
    };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  // `filename` is generated, never caller-controlled, so this join is safe.
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return {
    provider: "local",
    filename,
    url: `${UPLOAD_URL_PREFIX}/${filename}`,
    size: bytes.byteLength,
    ...(dimensions ?? {}),
  };
}

/**
 * Deletes the bytes behind a stored image.
 *
 * Dispatches on the record's own provider, not on the current configuration —
 * turning Cloudinary on must not orphan the files an earlier local upload wrote
 * to disk, and vice versa. Records written before this field existed have no
 * provider, so they are treated as local.
 */
export async function deleteUpload(stored: {
  filename: string;
  provider?: StorageProvider;
  publicId?: string;
}): Promise<void> {
  if (stored.provider === "cloudinary") {
    const config = getCloudinaryConfig();
    if (!config) {
      throw new Error(
        "This image is stored on Cloudinary, but Cloudinary is no longer configured. Restore CLOUDINARY_* in the environment to delete it.",
      );
    }
    // `publicId` should always be present for a Cloudinary record; the filename
    // stem is the same value it was derived from, so it is a safe fallback.
    await destroyOnCloudinary(config, stored.publicId ?? stored.filename.replace(/\.[^.]+$/, ""));
    return;
  }

  // Resolve the path and verify it is still inside the upload directory before
  // unlinking — belt and braces, since a filename read back from the database
  // should always be one we generated, but a corrupted record must not be able
  // to delete arbitrary files.
  const target = path.resolve(UPLOAD_DIR, stored.filename);
  if (!target.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    throw new Error("Refusing to delete a path outside the upload directory.");
  }

  try {
    await unlink(target);
  } catch (error) {
    // Already gone is a success for our purposes — the record is what matters.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
