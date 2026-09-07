/**
 * The upload contract, shared by the admin UI, the API routes and the model.
 *
 * Pure values and types with no imports, so the same limits are enforced on the
 * server and shown in the browser — a file the picker accepts is a file the
 * route will accept.
 */

/** Where an upload is filed. Also the first path segment of its public URL. */
export const UPLOAD_FOLDERS = ["products", "gallery", "pages", "misc"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export function isUploadFolder(value: unknown): value is UploadFolder {
  return typeof value === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(value);
}

/** Accepted image types, mapped to the extension the file is stored under. */
export const UPLOAD_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const UPLOAD_ACCEPT = Object.keys(UPLOAD_MIME_EXTENSIONS).join(",");

export function isAllowedUploadType(mimeType: string): boolean {
  return mimeType in UPLOAD_MIME_EXTENSIONS;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Prefix every stored upload's public URL carries. */
export const UPLOAD_URL_PREFIX = "/api/uploads";

/**
 * Filesystem-era URLs, from before uploads moved into MongoDB. The bytes are
 * gone on a serverless host, so the frontend swaps these for a placeholder
 * rather than rendering a broken image.
 */
export const LEGACY_UPLOAD_PREFIX = "/uploads/";

export type UploadResult = {
  success: true;
  url: string;
  filename: string;
  size: number;
  folder: UploadFolder;
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** True for a URL served by `/api/uploads/:folder/:filename`. */
export function isStoredUploadUrl(url: string): boolean {
  return url.startsWith(`${UPLOAD_URL_PREFIX}/`);
}

/**
 * Splits a stored-upload URL back into its two coordinates, or `null` when the
 * URL isn't one of ours. Rejects traversal and nested paths outright — the only
 * shape accepted is exactly `/api/uploads/<folder>/<filename>`.
 */
export function parseStoredUploadUrl(
  url: string,
): { folder: UploadFolder; filename: string } | null {
  if (!isStoredUploadUrl(url)) return null;

  // Drop any query or hash a caller may have appended for cache-busting.
  const path = url.split(/[?#]/, 1)[0];
  const segments = path.slice(UPLOAD_URL_PREFIX.length + 1).split("/");
  if (segments.length !== 2) return null;

  const [folder, filename] = segments;
  if (!isUploadFolder(folder)) return null;
  if (!isSafeUploadFilename(filename)) return null;

  return { folder, filename };
}

/**
 * The filenames this system generates: a timestamp, a random hex nonce, and one
 * of the four allowed extensions. Anything else — a path separator, `..`, an
 * empty string — is refused, which is what keeps the serving route from being
 * talked into reading a document it shouldn't.
 */
export function isSafeUploadFilename(filename: string): boolean {
  if (!filename || filename.length > 200) return false;
  if (filename.includes("/") || filename.includes("\\")) return false;
  if (filename === "." || filename === ".." || filename.includes("..")) return false;
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z0-9]+$/.test(filename);
}
