import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Image storage.
 *
 * Bytes are written to `public/uploads`, which Next.js serves as static assets.
 * This is deliberately the simplest thing that works: the project had no
 * storage layer, and adding an SDK + credentials for a feature the client may
 * not need would be the wrong trade.
 *
 * ---------------------------------------------------------------------------
 * IMPORTANT DEPLOYMENT NOTE
 *
 * Local files do NOT survive a serverless deploy. On Vercel, Netlify Functions,
 * or any platform with a read-only/ephemeral filesystem, uploads will fail or
 * silently disappear on the next build. For those platforms the bytes must live
 * in object storage, with the `Media` collection kept as the index.
 *
 * To move to Cloudinary, set these and replace `saveUpload`/`deleteUpload`:
 *   CLOUDINARY_CLOUD_NAME   the cloud name from your Cloudinary dashboard
 *   CLOUDINARY_API_KEY      API key
 *   CLOUDINARY_API_SECRET   API secret (server-side only)
 *
 * For S3-compatible storage instead:
 *   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL
 *
 * `.env.example` lists both sets, commented out, so nothing is required until
 * you actually adopt one.
 * ---------------------------------------------------------------------------
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

export type SavedUpload = {
  filename: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
};

/** Writes the bytes and returns the record fields for the Media collection. */
export async function saveUpload(
  originalName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<SavedUpload> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = buildFilename(originalName, mimeType);
  // `filename` is generated, never caller-controlled, so this join is safe.
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  const dimensions = readImageSize(bytes);

  return {
    filename,
    url: `${UPLOAD_URL_PREFIX}/${filename}`,
    size: bytes.byteLength,
    ...(dimensions ?? {}),
  };
}

/**
 * Deletes the bytes for a stored filename.
 *
 * Resolves the path and verifies it is still inside the upload directory before
 * unlinking — belt and braces, since a filename read back from the database
 * should always be one we generated, but a corrupted record must not be able to
 * delete arbitrary files.
 */
export async function deleteUpload(filename: string): Promise<void> {
  const target = path.resolve(UPLOAD_DIR, filename);
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
