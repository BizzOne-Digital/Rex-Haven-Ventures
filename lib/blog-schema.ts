/**
 * Shared blog vocabulary — the small set of constants that the database models,
 * the server-side validators and the admin/member forms all have to agree on.
 *
 * No framework or server imports, so it is safe on both sides of the wire.
 * The category list is re-exported from `lib/articles.ts` to keep a single
 * source of truth with the existing built-in content.
 */

import { categories, type ArticleCategory, type ArticleCover } from "@/lib/articles";

export const articleCategories = categories;
export type { ArticleCategory, ArticleCover };

/** Abstract cover-art keys understood by `components/blog/ArticleCover.tsx`. */
export const articleCovers: ArticleCover[] = [
  "arch",
  "grid",
  "ridge",
  "orbit",
  "column",
  "wave",
  "spark",
];

/** Editorial workflow state for a blog post. */
export const postStatuses = ["draft", "published"] as const;
export type PostStatusValue = (typeof postStatuses)[number];

/** Moderation state for a member submission. */
export const feedbackStatuses = ["pending", "approved", "rejected"] as const;
export type FeedbackStatusValue = (typeof feedbackStatuses)[number];

/** What a member is contributing. Both are moderated identically. */
export const feedbackKinds = ["feedback", "insight"] as const;
export type FeedbackKindValue = (typeof feedbackKinds)[number];

export const feedbackKindLabels: Record<FeedbackKindValue, string> = {
  feedback: "Feedback",
  insight: "Insight",
};

export const feedbackStatusLabels: Record<FeedbackStatusValue, string> = {
  pending: "Awaiting review",
  approved: "Published",
  rejected: "Not published",
};
