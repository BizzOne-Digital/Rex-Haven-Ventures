/**
 * Wire shapes for feedback / insight submissions.
 *
 * Pure types with no imports, shared by the route handlers that produce them
 * and the client components that consume them. Note what is absent: no author
 * email on the public shape, and no internal identifiers beyond the id.
 */

/** What any visitor may see: an approved submission, attributed by name only. */
export type PublicFeedback = {
  id: string;
  kind: string;
  body: string;
  authorName: string;
  createdAt: string;
};

/** What a member sees about their own submission, including its moderation state. */
export type MySubmission = {
  id: string;
  kind: string;
  body: string;
  status: string;
  postSlug: string;
  postTitle: string;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

/** The full record, for administrators only. */
export type AdminFeedback = MySubmission & {
  authorId: string;
  authorName: string;
  authorEmail: string;
  moderatedAt: string | null;
};

export type FeedbackCounts = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};
