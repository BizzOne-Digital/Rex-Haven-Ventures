/**
 * Sanitisation for member-submitted text.
 *
 * Submissions are rendered as plain text (never `dangerouslySetInnerHTML`), so
 * React already escapes them on output. This is defence in depth for the other
 * paths the same string travels: the moderation queue, exports, and any future
 * HTML email. The strategy is to strip rather than escape — members are writing
 * prose, so markup is never legitimate content here.
 */

/** Combining diacritical marks left behind by NFKD normalisation. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Drops control characters, keeping the whitespace that carries meaning in
 * prose (tab, newline, carriage return). Written as a code-point scan rather
 * than a character-class regex so the ranges stay readable.
 */
function stripControlChars(input: string): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    const isMeaningfulWhitespace = code === 9 || code === 10 || code === 13;
    if (isMeaningfulWhitespace) {
      out += char;
      continue;
    }
    if (code < 32 || code === 127) continue;
    out += char;
  }
  return out;
}

/** Removes HTML tags, entity-encoded angle brackets, and control characters. */
export function sanitizeText(input: string): string {
  const withoutMarkup = input
    // Drop anything tag-shaped, including an unclosed tag at end of string.
    .replace(/<[^>]*>?/g, "")
    // Neutralise pre-encoded markup so it cannot be decoded downstream.
    .replace(/&(?:lt|gt|#0*60|#0*62|#x0*3c|#x0*3e);/gi, "");

  return stripControlChars(withoutMarkup).trim();
}

/** Collapses runs of blank lines so stored prose stays tidy. */
export function normalizeParagraphs(input: string): string {
  return sanitizeText(input)
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Splits stored prose into paragraphs for rendering as plain text nodes. */
export function toParagraphs(input: string): string[] {
  return input
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** URL guard for admin-supplied cover images — blocks `javascript:` and friends. */
export function sanitizeImageUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed; // site-relative asset
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/** Turns a title into a URL-safe slug. */
export function slugify(input: string): string {
  return sanitizeText(input)
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
