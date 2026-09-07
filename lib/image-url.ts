import { LEGACY_UPLOAD_PREFIX } from "@/lib/upload-types";

/**
 * Image URL resolution for anything an administrator supplied.
 *
 * Uploads used to be written to `public/uploads` before they moved into
 * MongoDB. Those files are gone — the deploy that changed this took the
 * filesystem with it — so any surviving `/uploads/...` reference would render
 * as a broken image. It resolves to a placeholder instead, which reads as
 * "image missing" rather than as a bug, and leaves the record editable.
 */

export const IMAGE_PLACEHOLDER = "/img/placeholder.svg";

/** True for a path left over from the filesystem-backed upload era. */
export function isLegacyUploadUrl(url: string): boolean {
  return url.startsWith(LEGACY_UPLOAD_PREFIX);
}

/** The URL to actually render, or `null` when there is no image at all. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return isLegacyUploadUrl(trimmed) ? IMAGE_PLACEHOLDER : trimmed;
}
