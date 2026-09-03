/**
 * Shared validation for blog posts, used by the admin editor and the admin API.
 * No framework imports; safe on both sides.
 */

import {
  articleCategories,
  articleCovers,
  postStatuses,
  type ArticleCategory,
  type ArticleCover,
  type PostStatusValue,
} from "@/lib/blog-schema";

export type PostBlockDraft =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type PostValues = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  readingMinutes: string;
  author: string;
  cover: string;
  coverImage: string;
  /** Comma-separated in the editor; normalised to an array server-side. */
  tags: string;
  featured: boolean;
  status: string;
  /** Long-form body, authored as plain text. Blank lines separate paragraphs. */
  body: string;
  seoTitle: string;
  seoDescription: string;
};

export type PostFieldErrors = Partial<Record<keyof PostValues, string>>;

export const TITLE_MAX = 200;
export const EXCERPT_MAX = 500;
export const SEO_TITLE_MAX = 200;
export const SEO_DESCRIPTION_MAX = 500;
export const BODY_MIN = 50;
export const TAGS_MAX = 12;
export const TAG_MAX_LENGTH = 32;

/**
 * Parses the editor's comma-separated tag field into a clean list:
 * trimmed, lowercased, de-duplicated, capped in both count and length.
 */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(",")) {
    const tag = raw.trim().toLowerCase().slice(0, TAG_MAX_LENGTH);
    if (tag) seen.add(tag);
    if (seen.size >= TAGS_MAX) break;
  }
  return [...seen];
}

/** Inverse of `parseTags`, for loading a post back into the editor. */
export function serializeTags(tags: string[]): string {
  return tags.join(", ");
}

/** Today's date as `YYYY-MM-DD`, the storage format `Article.date` uses. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const emptyPostValues: PostValues = {
  title: "",
  slug: "",
  excerpt: "",
  // Placeholder default; the editor replaces it with the first live category.
  category: articleCategories[0],
  date: todayIso(),
  readingMinutes: "5",
  author: "Rex Haven Ventures",
  cover: "arch",
  coverImage: "",
  tags: "",
  featured: false,
  status: "draft",
  body: "",
  seoTitle: "",
  seoDescription: "",
};

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export function isValidSlug(slug: string): boolean {
  return slugRe.test(slug) && slug.length <= 120;
}

export function isValidIsoDate(value: string): boolean {
  if (!dateRe.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates like 2026-02-31, which `Date` would roll over.
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Estimated reading time from the body text, at 200 words per minute.
 * Offered as a convenience in the editor; the stored value stays editable.
 */
export function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function validatePost(values: Partial<PostValues>): PostFieldErrors {
  const errors: PostFieldErrors = {};
  const v = { ...emptyPostValues, ...values };

  const title = v.title.trim();
  if (!title) errors.title = "Please add a title.";
  else if (title.length < 3) errors.title = "Please add a slightly longer title.";
  else if (title.length > TITLE_MAX) errors.title = `Please keep the title under ${TITLE_MAX} characters.`;

  const slug = v.slug.trim();
  if (!slug) {
    errors.slug = "Please add a URL slug.";
  } else if (!isValidSlug(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens (e.g. the-long-game).";
  }

  const excerpt = v.excerpt.trim();
  if (!excerpt) errors.excerpt = "Please add a short excerpt.";
  else if (excerpt.length < 20) errors.excerpt = "Please add a slightly longer excerpt.";
  else if (excerpt.length > EXCERPT_MAX) errors.excerpt = `Please keep the excerpt under ${EXCERPT_MAX} characters.`;

  // Presence only. The valid set lives in the Category collection and changes
  // at runtime, so membership is checked server-side against the live list.
  if (!v.category.trim()) {
    errors.category = "Please choose a category.";
  } else if (v.category.trim().length > 60) {
    errors.category = "That category name is too long.";
  }

  if (!isValidIsoDate(v.date)) {
    errors.date = "Please choose a valid publication date.";
  }

  const minutes = Number(v.readingMinutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
    errors.readingMinutes = "Please enter a reading time between 1 and 120 minutes.";
  }

  const author = v.author.trim();
  if (!author) errors.author = "Please add an author byline.";
  else if (author.length > 120) errors.author = "Please keep the byline under 120 characters.";

  if (!(articleCovers as string[]).includes(v.cover)) {
    errors.cover = "Please choose a cover style.";
  }

  if (v.coverImage.trim()) {
    const url = v.coverImage.trim();
    const looksAbsolute = /^https?:\/\//i.test(url);
    const looksRelative = url.startsWith("/");
    if (!looksAbsolute && !looksRelative) {
      errors.coverImage = "Use a full https:// URL or a path starting with /.";
    }
  }

  if (!(postStatuses as readonly string[]).includes(v.status)) {
    errors.status = "Please choose a status.";
  }

  const body = v.body.trim();
  if (!body) errors.body = "Please write the article body.";
  else if (body.length < BODY_MIN) errors.body = `Please write at least ${BODY_MIN} characters.`;

  if (v.seoTitle.trim().length > SEO_TITLE_MAX) {
    errors.seoTitle = `Please keep the SEO title under ${SEO_TITLE_MAX} characters.`;
  }
  if (v.seoDescription.trim().length > SEO_DESCRIPTION_MAX) {
    errors.seoDescription = `Please keep the SEO description under ${SEO_DESCRIPTION_MAX} characters.`;
  }

  return errors;
}

export function hasPostErrors(errors: PostFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Parses the editor's plain-text body into the `ContentBlock[]` the article
 * renderer expects. The authoring conventions are intentionally minimal:
 *
 *   ## Heading      -> h2
 *   > Pull quote    -> quote
 *   - list item     -> list (consecutive items merge into one block)
 *   anything else   -> paragraph
 */
export function parseBody(body: string): PostBlockDraft[] {
  const blocks: PostBlockDraft[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({ type: "list", items: listBuffer });
      listBuffer = [];
    }
  };

  for (const rawLine of body.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }
    // Deeper heading first: "### x" does not start with "## " (the third
    // character is '#', not a space), but ordering it this way keeps the intent
    // obvious rather than relying on that.
    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("> ")) {
      flushList();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2).trim());
      continue;
    }
    // Numbered lists render as the same bulleted block: the design has one list
    // style, so the number would be decoration the renderer then ignores.
    const numbered = /^\d{1,3}[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      listBuffer.push(numbered[1].trim());
      continue;
    }

    flushList();
    blocks.push({ type: "p", text: line });
  }

  flushList();
  return blocks.filter((block) =>
    block.type === "list" ? block.items.length > 0 : block.text.length > 0,
  );
}

/** Inverse of `parseBody`, so an existing post round-trips into the editor. */
export function serializeBody(blocks: PostBlockDraft[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "h2":
          return `## ${block.text}`;
        case "h3":
          return `### ${block.text}`;
        case "quote":
          return `> ${block.text}`;
        case "list":
          return block.items.map((item) => `- ${item}`).join("\n");
        default:
          return block.text;
      }
    })
    .join("\n\n");
}

export type { ArticleCategory, ArticleCover, PostStatusValue };
