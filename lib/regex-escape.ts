/**
 * Escapes a string so it can be embedded in a regular expression literally.
 *
 * The admin search boxes build `RegExp` objects from operator input. Without
 * this, a search for `a.*` would run as a wildcard, and a malformed pattern
 * would throw — so every user-supplied term goes through here first.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a case-insensitive "contains" matcher from untrusted input. */
export function containsRegex(input: string): RegExp {
  return new RegExp(escapeRegex(input), "i");
}
