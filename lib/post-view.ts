import "server-only";
import type { BlogPostDocument } from "@/lib/db/models/BlogPost";
import type { AdminPost } from "@/lib/post-types";

/** Projection of a BlogPost document for the admin UI. */
export function toAdminPost(doc: BlogPostDocument): AdminPost {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    category: doc.category,
    date: doc.date,
    readingMinutes: doc.readingMinutes,
    author: doc.author,
    cover: doc.cover,
    coverImage: doc.coverImage ?? "",
    tags: doc.tags ?? [],
    featured: doc.featured,
    status: doc.status,
    content: doc.content ?? [],
    seoTitle: doc.seoTitle ?? "",
    seoDescription: doc.seoDescription ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
