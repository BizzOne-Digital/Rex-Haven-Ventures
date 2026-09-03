import "server-only";
import {
  articles as builtInArticles,
  type Article,
  type ArticleCover,
  type ContentBlock,
} from "@/lib/articles";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { articleCovers } from "@/lib/blog-schema";

/**
 * Server-side blog data source.
 *
 * The existing blog components all consume the `Article` shape from
 * `lib/articles.ts`, so this module maps MongoDB documents onto that same shape.
 * Nothing downstream had to change.
 *
 * Resolution order, deliberately forgiving:
 *   1. Published posts in MongoDB.
 *   2. The built-in content in `lib/articles.ts`, used when the database is
 *      unconfigured, unreachable, or simply has no published posts yet.
 *
 * That fallback is what keeps the public blog working exactly as it did before
 * this feature existed — an empty or missing database never blanks the site.
 */

export type BlogSource = "database" | "builtin";

export type BlogData = {
  articles: Article[];
  source: BlogSource;
  /** True when the built-in placeholder content is what's on screen. */
  isDemoContent: boolean;
};

/**
 * Cover art keys are a closed set — `components/blog/ArticleCover.tsx` maps each
 * one to specific gradient/motif artwork, so an unknown key has nothing to
 * render and falls back to the default.
 *
 * Categories are deliberately NOT validated here: they are managed in the
 * Category collection and pass through as authored. Coercing an unrecognised
 * category to a default would silently mislabel posts in a custom taxonomy.
 */
function isKnownCover(value: string): value is ArticleCover {
  return (articleCovers as string[]).includes(value);
}

/** Maps a database document onto the `Article` shape the UI already renders. */
export function postToArticle(post: BlogPostDocument): Article {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    readingMinutes: post.readingMinutes,
    author: post.author,
    cover: isKnownCover(post.cover) ? post.cover : "arch",
    ...(post.coverImage ? { coverImage: post.coverImage } : {}),
    featured: post.featured,
    content: (post.content ?? []) as ContentBlock[],
    ...(post.tags && post.tags.length > 0 ? { tags: post.tags } : {}),
    ...(post.seoTitle ? { seoTitle: post.seoTitle } : {}),
    ...(post.seoDescription ? { seoDescription: post.seoDescription } : {}),
  };
}

const newestFirst = (a: Article, b: Article) => (a.date < b.date ? 1 : -1);

/** Built-in content, presented in the same order the database path returns. */
function builtInData(): BlogData {
  return {
    articles: [...builtInArticles].sort(newestFirst),
    source: "builtin",
    isDemoContent: true,
  };
}

/**
 * All publicly visible articles, newest first.
 * Draft posts are excluded at the query level, never filtered in the UI.
 */
export async function getBlogData(): Promise<BlogData> {
  if (!isDatabaseConfigured()) return builtInData();

  try {
    await connectToDatabase();
    const posts = await BlogPost.find({ status: "published" })
      .sort({ date: -1, createdAt: -1 })
      .lean<BlogPostDocument[]>();

    if (posts.length === 0) return builtInData();

    return {
      articles: posts.map(postToArticle),
      source: "database",
      isDemoContent: false,
    };
  } catch (error) {
    console.error("[blog-source] falling back to built-in content:", error);
    return builtInData();
  }
}

/** The lead article for the blog index — an explicit feature, else the newest. */
export async function getFeatured(): Promise<{ featured: Article; rest: Article[]; data: BlogData }> {
  const data = await getBlogData();
  const featured = data.articles.find((a) => a.featured) ?? data.articles[0];
  const rest = data.articles.filter((a) => a.slug !== featured?.slug).sort(newestFirst);
  return { featured, rest, data };
}

export async function getArticleBySlug(
  slug: string,
): Promise<{ article: Article; isDemoContent: boolean } | null> {
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const post = await BlogPost.findOne({
        slug: slug.toLowerCase(),
        status: "published",
      }).lean<BlogPostDocument | null>();

      if (post) return { article: postToArticle(post), isDemoContent: false };

      // Not in the database. Only fall through to built-in content when the
      // database has no published posts at all — otherwise the database is
      // authoritative and this slug genuinely doesn't exist.
      const publishedCount = await BlogPost.countDocuments({ status: "published" });
      if (publishedCount > 0) return null;
    } catch (error) {
      console.error("[blog-source] article lookup failed, trying built-in content:", error);
    }
  }

  const builtIn = builtInArticles.find((a) => a.slug === slug);
  return builtIn ? { article: builtIn, isDemoContent: true } : null;
}

/** Same-category-first related articles, mirroring the original behaviour. */
export async function getRelated(slug: string, limit = 3): Promise<Article[]> {
  const { articles } = await getBlogData();
  const current = articles.find((a) => a.slug === slug);
  if (!current) return articles.slice(0, limit);

  const sameCategory = articles.filter((a) => a.slug !== slug && a.category === current.category);
  const others = articles.filter((a) => a.slug !== slug && a.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}

/**
 * Slugs for `generateStaticParams` and the sitemap.
 * Includes built-in slugs alongside database ones so previously indexed URLs
 * keep resolving even after the database becomes the primary source.
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  const slugs = new Set<string>(builtInArticles.map((a) => a.slug));

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const posts = await BlogPost.find({ status: "published" })
        .select("slug")
        .lean<{ slug: string }[]>();
      for (const post of posts) slugs.add(post.slug);
    } catch {
      // Build-time database access is optional — built-in slugs are enough.
    }
  }

  return [...slugs];
}

/** Dates keyed by slug, for sitemap `lastModified`. */
export async function getArticleSitemapEntries(): Promise<{ slug: string; date: string }[]> {
  const { articles } = await getBlogData();
  const entries = new Map<string, string>(builtInArticles.map((a) => [a.slug, a.date]));
  for (const article of articles) entries.set(article.slug, article.date);
  return [...entries].map(([slug, date]) => ({ slug, date }));
}
