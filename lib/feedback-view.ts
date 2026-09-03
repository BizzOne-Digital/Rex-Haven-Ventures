import "server-only";
import type { FeedbackDocument } from "@/lib/db/models/Feedback";
import type {
  AdminFeedback,
  MySubmission,
  PublicFeedback,
} from "@/lib/feedback-types";

/**
 * Projections from a Feedback document to the three audience-specific shapes.
 *
 * Keeping these in one place is the point: the public projection physically
 * cannot include the author's email address, because it is never read here.
 */

export function toPublicFeedback(doc: FeedbackDocument): PublicFeedback {
  return {
    id: String(doc._id),
    kind: doc.kind,
    body: doc.body,
    authorName: doc.authorName,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toMySubmission(doc: FeedbackDocument): MySubmission {
  return {
    id: String(doc._id),
    kind: doc.kind,
    body: doc.body,
    status: doc.status,
    postSlug: doc.postSlug,
    postTitle: doc.postTitle,
    moderationNote: doc.moderationNote ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toAdminFeedback(doc: FeedbackDocument): AdminFeedback {
  return {
    ...toMySubmission(doc),
    authorId: String(doc.author),
    authorName: doc.authorName,
    authorEmail: doc.authorEmail,
    moderatedAt: doc.moderatedAt ? doc.moderatedAt.toISOString() : null,
  };
}
