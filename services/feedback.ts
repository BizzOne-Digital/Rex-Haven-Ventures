import { apiRequest, type ApiResult } from "@/services/api-client";
import type { FeedbackCounts, MySubmission, PublicFeedback } from "@/lib/feedback-types";
import type { FeedbackValues } from "@/lib/feedback-validation";

/** Client-side calls for member feedback and insights. */

export function fetchApprovedFeedback(
  postSlug: string,
  signal?: AbortSignal,
): Promise<ApiResult<{ items: PublicFeedback[]; total: number }>> {
  return apiRequest(`/api/feedback?postSlug=${encodeURIComponent(postSlug)}`, { signal });
}

export function submitFeedback(
  postSlug: string,
  values: FeedbackValues,
): Promise<ApiResult<{ submission: { id: string; status: string; createdAt: string } }>> {
  return apiRequest("/api/feedback", {
    method: "POST",
    body: { postSlug, ...values },
  });
}

export function fetchMySubmissions(
  signal?: AbortSignal,
): Promise<ApiResult<{ items: MySubmission[]; counts: FeedbackCounts }>> {
  return apiRequest("/api/feedback/mine", { signal });
}

export function updateMySubmission(
  id: string,
  values: Partial<FeedbackValues>,
): Promise<ApiResult<{ submission: MySubmission }>> {
  return apiRequest(`/api/feedback/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: values,
  });
}

export function withdrawMySubmission(id: string): Promise<ApiResult<{ ok: true }>> {
  return apiRequest(`/api/feedback/${encodeURIComponent(id)}`, { method: "DELETE" });
}
