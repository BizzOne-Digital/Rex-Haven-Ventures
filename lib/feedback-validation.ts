/**
 * Shared validation for member feedback / insight submissions.
 * Used by the blog form and the submission API. No framework imports.
 */

import { feedbackKinds, type FeedbackKindValue } from "@/lib/blog-schema";

export const FEEDBACK_MIN_LENGTH = 20;
export const FEEDBACK_MAX_LENGTH = 2000;

export type FeedbackValues = {
  kind: string;
  body: string;
};

export type FeedbackFieldErrors = Partial<Record<keyof FeedbackValues, string>>;

export const emptyFeedbackValues: FeedbackValues = {
  kind: "feedback",
  body: "",
};

export function validateFeedback(values: Partial<FeedbackValues>): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {};
  const v = { ...emptyFeedbackValues, ...values };

  if (!feedbackKinds.includes(v.kind as FeedbackKindValue)) {
    errors.kind = "Please choose what you'd like to share.";
  }

  const body = v.body.trim();
  if (!body) {
    errors.body = "Please write your thoughts before submitting.";
  } else if (body.length < FEEDBACK_MIN_LENGTH) {
    errors.body = `Please add a little more detail (at least ${FEEDBACK_MIN_LENGTH} characters).`;
  } else if (body.length > FEEDBACK_MAX_LENGTH) {
    errors.body = `Please keep this under ${FEEDBACK_MAX_LENGTH} characters.`;
  }

  return errors;
}

export function hasFeedbackErrors(errors: FeedbackFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
