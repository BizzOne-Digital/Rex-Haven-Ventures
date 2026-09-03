import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";
import { feedbackStatuses, feedbackKinds } from "@/lib/blog-schema";

/**
 * A member's feedback or insight on a blog post.
 *
 * Submissions are created with `status: "pending"` and are invisible to the
 * public until an administrator approves them. `postSlug` is denormalised
 * alongside `post` so the public "approved submissions for this article" query
 * needs no join, and so a submission survives a post being renamed or removed.
 */

export type FeedbackDocument = {
  _id: Types.ObjectId;
  post: Types.ObjectId | null;
  postSlug: string;
  postTitle: string;
  author: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  kind: string;
  body: string;
  status: string;
  /** Optional note from the moderator, shown to the submitting member. */
  moderationNote?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const FEEDBACK_MIN_LENGTH = 20;
export const FEEDBACK_MAX_LENGTH = 2000;

const FeedbackSchema = new Schema<FeedbackDocument>(
  {
    post: { type: Schema.Types.ObjectId, ref: "BlogPost", default: null },
    postSlug: { type: String, required: true, trim: true, lowercase: true },
    postTitle: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Snapshot of the author at submission time, so the moderation queue stays
    // readable even if the account is later renamed or deleted.
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    kind: { type: String, enum: feedbackKinds, default: "feedback" },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: FEEDBACK_MIN_LENGTH,
      maxlength: FEEDBACK_MAX_LENGTH,
    },
    status: { type: String, enum: feedbackStatuses, default: "pending", index: true },
    moderationNote: { type: String, trim: true, maxlength: 500 },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
  },
  { timestamps: true },
);

// Public read path: approved submissions for one article, newest first.
FeedbackSchema.index({ postSlug: 1, status: 1, createdAt: -1 });
// Member's own submissions across all articles.
FeedbackSchema.index({ author: 1, createdAt: -1 });
// Admin moderation queue, filtered by status.
FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ post: 1, status: 1 });

export const Feedback: Model<FeedbackDocument> =
  (mongoose.models.Feedback as Model<FeedbackDocument>) ??
  mongoose.model<FeedbackDocument>("Feedback", FeedbackSchema);
