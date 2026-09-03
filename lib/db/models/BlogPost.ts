import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";
import { articleCovers } from "@/lib/blog-schema";

/**
 * Blog post.
 *
 * Deliberately mirrors the `Article` shape in `lib/articles.ts` so the existing
 * blog components (ArticleCard, FeaturedArticle, BlogIndex, ArticleCover) render
 * database-backed posts without any changes. `lib/blog-source.ts` maps between
 * the two.
 */

export const POST_STATUSES = ["draft", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type BlogContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type BlogPostDocument = {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** Publication date, stored as an ISO `YYYY-MM-DD` string to match `Article`. */
  date: string;
  readingMinutes: number;
  author: string;
  /** Abstract cover-art key, used when `coverImage` is absent. */
  cover: string;
  coverImage?: string;
  /** Free-form tags, lowercased and de-duplicated on save. */
  tags: string[];
  featured: boolean;
  status: PostStatus;
  content: BlogContentBlock[];
  /** SEO overrides. Fall back to `title` / `excerpt` when empty. */
  seoTitle?: string;
  seoDescription?: string;
  /** Set when a post originates from the built-in `lib/articles.ts` content. */
  seededFrom?: string;
  createdAt: Date;
  updatedAt: Date;
};

const ContentBlockSchema = new Schema<BlogContentBlock>(
  {
    type: { type: String, enum: ["p", "h2", "h3", "quote", "list"], required: true },
    text: { type: String, default: undefined },
    items: { type: [String], default: undefined },
  },
  { _id: false },
);

const BlogPostSchema = new Schema<BlogPostDocument>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    // Not an enum: categories are managed in the Category collection, so the
    // valid set changes at runtime. The API validates against the live list.
    category: { type: String, required: true, trim: true, maxlength: 60 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    readingMinutes: { type: Number, required: true, min: 1, max: 120 },
    author: { type: String, required: true, trim: true, maxlength: 120 },
    cover: { type: String, required: true, enum: articleCovers, default: "arch" },
    coverImage: { type: String, trim: true, maxlength: 2000 },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: POST_STATUSES, default: "draft", index: true },
    content: { type: [ContentBlockSchema], default: [] },
    seoTitle: { type: String, trim: true, maxlength: 200 },
    seoDescription: { type: String, trim: true, maxlength: 500 },
    seededFrom: { type: String, trim: true },
  },
  { timestamps: true },
);

// Slug is the public URL key — unique, and the index every article page uses.
BlogPostSchema.index({ slug: 1 }, { unique: true });
// Covers the blog index query: published posts, newest first.
BlogPostSchema.index({ status: 1, date: -1 });
BlogPostSchema.index({ status: 1, featured: -1, date: -1 });
// Category filtering, and the "are any posts still using this category?" check
// that guards category deletion.
BlogPostSchema.index({ category: 1, status: 1 });
BlogPostSchema.index({ tags: 1 });

export const BlogPost: Model<BlogPostDocument> =
  (mongoose.models.BlogPost as Model<BlogPostDocument>) ??
  mongoose.model<BlogPostDocument>("BlogPost", BlogPostSchema);
