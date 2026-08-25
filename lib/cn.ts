export type ClassValue = string | number | null | false | undefined;

/** Minimal class-name joiner — avoids pulling in a dependency for simple concatenation. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
