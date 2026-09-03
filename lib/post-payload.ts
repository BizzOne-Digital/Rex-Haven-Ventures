import "server-only";
import { revalidatePath } from "next/cache";
import { sanitizeImageUrl, sanitizeText, slugify } from "@/lib/sanitize";
import { parseBody, parseTags, type PostValues } from "@/lib/post-validation";
import type { BlogContentBlock, PostStatus } from "@/lib/db/models/BlogPost";
import type { ArticleCover } from "@/lib/blog-schema";

/**
 * Turns validated editor input into the fields stored on a BlogPost.
 *
 * Admin-authored prose is trusted more than member submissions, but it is still
 * stripped of markup: the article renderer emits plain text nodes, so any tag
 * would show up as literal characters rather than formatting. Stripping keeps
 * what's stored and what's rendered honest with each other.
 */

export type PostPayload = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingMinutes: number;
  author: string;
  cover: ArticleCover;
  coverImage?: string;
  tags: string[];
  featured: boolean;
  status: PostStatus;
  content: BlogContentBlock[];
  seoTitle?: string;
  seoDescription?: string;
};

function cleanBlocks(body: string): BlogContentBlock[] {
  return parseBody(body)
    .map((block): BlogContentBlock | null => {
      if (block.type === "list") {
        const items = block.items.map(sanitizeText).filter(Boolean);
        return items.length > 0 ? { type: "list", items } : null;
      }
      const text = sanitizeText(block.text);
      return text ? { type: block.type, text } : null;
    })
    .filter((block): block is BlogContentBlock => block !== null);
}

/**
 * Call only on values that `validatePost` has already accepted — that is what
 * guarantees `cover` and `status` hold members of their respective enums.
 * `category` is validated separately against the live Category collection.
 */
export function buildPostPayload(values: PostValues): PostPayload {
  const coverImage = sanitizeImageUrl(values.coverImage);
  const seoTitle = sanitizeText(values.seoTitle);
  const seoDescription = sanitizeText(values.seoDescription);

  return {
    // Fall back to a slug derived from the title if the field came in blank.
    slug: slugify(values.slug) || slugify(values.title),
    title: sanitizeText(values.title),
    excerpt: sanitizeText(values.excerpt),
    category: sanitizeText(values.category).trim(),
    date: values.date,
    readingMinutes: Number(values.readingMinutes),
    author: sanitizeText(values.author),
    cover: values.cover as ArticleCover,
    ...(coverImage ? { coverImage } : { coverImage: undefined }),
    tags: parseTags(values.tags),
    featured: Boolean(values.featured),
    status: values.status as PostStatus,
    content: cleanBlocks(values.body),
    ...(seoTitle ? { seoTitle } : { seoTitle: undefined }),
    ...(seoDescription ? { seoDescription } : { seoDescription: undefined }),
  };
}

/**
 * Invalidates every cached surface that renders blog content.
 *
 * The blog index and article pages are statically generated, so without this an
 * admin edit wouldn't appear until the next deploy. Called after every create,
 * update and delete — including for the previous slug when one is renamed.
 */
export function revalidateBlog(slugs: (string | undefined)[] = []): void {
  revalidatePath("/");        // homepage insights preview
  revalidatePath("/blog");    // blog index
  revalidatePath("/sitemap.xml");

  for (const slug of new Set(slugs.filter(Boolean) as string[])) {
    revalidatePath(`/blog/${slug}`);
  }
}
