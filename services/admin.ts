import { apiRequest, type ApiResult } from "@/services/api-client";
import type { AdminFeedback, FeedbackCounts } from "@/lib/feedback-types";
import type { AdminPost, PostCounts } from "@/lib/post-types";
import type { PostValues } from "@/lib/post-validation";
import type { SessionUser } from "@/services/auth";

/** Client-side calls for the admin dashboard. Every endpoint is admin-guarded. */

export type AdminStats = {
  users: { total: number; active: number; members: number; admins: number };
  posts: PostCounts;
  feedback: FeedbackCounts;
};

export type AdminUserRow = SessionUser & { submissionCount: number };

export type Paginated = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ---- Dashboard ----

export function fetchStats(signal?: AbortSignal): Promise<ApiResult<AdminStats>> {
  return apiRequest("/api/admin/stats", { signal });
}

// ---- Users ----

export type UserQuery = {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
};

export function fetchUsers(
  query: UserQuery = {},
  signal?: AbortSignal,
): Promise<ApiResult<Paginated & { items: AdminUserRow[] }>> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.role && query.role !== "all") params.set("role", query.role);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.page && query.page > 1) params.set("page", String(query.page));

  const qs = params.toString();
  return apiRequest(`/api/admin/users${qs ? `?${qs}` : ""}`, { signal });
}

export function fetchUser(
  id: string,
  signal?: AbortSignal,
): Promise<ApiResult<{ user: SessionUser; submissions: AdminFeedback[] }>> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { signal });
}

export function updateUser(
  id: string,
  changes: { name?: string; isActive?: boolean; role?: string },
): Promise<ApiResult<{ user: SessionUser }>> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: changes,
  });
}

export function deleteUser(id: string): Promise<ApiResult<{ deletedSubmissions: number }>> {
  return apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Blog posts ----

export function fetchPosts(
  query: { status?: string; q?: string } = {},
  signal?: AbortSignal,
): Promise<ApiResult<{ items: AdminPost[]; counts: PostCounts }>> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.q) params.set("q", query.q);

  const qs = params.toString();
  return apiRequest(`/api/admin/posts${qs ? `?${qs}` : ""}`, { signal });
}

export function fetchPost(
  id: string,
  signal?: AbortSignal,
): Promise<ApiResult<{ post: AdminPost; body: string }>> {
  return apiRequest(`/api/admin/posts/${encodeURIComponent(id)}`, { signal });
}

export function createPost(
  values: PostValues,
): Promise<ApiResult<{ post: AdminPost; body: string }>> {
  return apiRequest("/api/admin/posts", { method: "POST", body: values });
}

export function updatePost(
  id: string,
  values: Partial<PostValues>,
): Promise<ApiResult<{ post: AdminPost; body?: string }>> {
  return apiRequest(`/api/admin/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: values,
  });
}

/** Publish / unpublish toggle — sends only `status`, skipping full validation. */
export function setPostStatus(
  id: string,
  status: "draft" | "published",
): Promise<ApiResult<{ post: AdminPost }>> {
  return apiRequest(`/api/admin/posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
  });
}

export function deletePost(id: string): Promise<ApiResult<{ ok: true }>> {
  return apiRequest(`/api/admin/posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Imports the built-in `lib/articles.ts` content into MongoDB. Idempotent. */
export function importBuiltInPosts(): Promise<
  ApiResult<{ imported: number; skipped: number; total: number }>
> {
  return apiRequest("/api/admin/seed", { method: "POST" });
}

// ---- Moderation ----

export type FeedbackQuery = {
  status?: string;
  q?: string;
  page?: number;
};

export function fetchAdminFeedback(
  query: FeedbackQuery = {},
  signal?: AbortSignal,
): Promise<ApiResult<Paginated & { items: AdminFeedback[]; counts: FeedbackCounts }>> {
  const params = new URLSearchParams();
  params.set("status", query.status && query.status !== "all" ? query.status : "all");
  if (query.q) params.set("q", query.q);
  if (query.page && query.page > 1) params.set("page", String(query.page));

  return apiRequest(`/api/admin/feedback?${params.toString()}`, { signal });
}

export function moderateFeedback(
  id: string,
  status: "pending" | "approved" | "rejected",
  moderationNote?: string,
): Promise<ApiResult<{ submission: AdminFeedback }>> {
  return apiRequest(`/api/admin/feedback/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status, ...(moderationNote === undefined ? {} : { moderationNote }) },
  });
}

export function deleteFeedback(id: string): Promise<ApiResult<{ ok: true }>> {
  return apiRequest(`/api/admin/feedback/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Dashboard (counters + recent activity) ----

export type RecentPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  status: string;
};

export type RecentMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type RecentFeedback = {
  id: string;
  authorName: string;
  postTitle: string;
  postSlug: string;
  kind: string;
  status: string;
  excerpt: string;
  createdAt: string;
};

export type DashboardData = {
  stats: AdminStats & { categories: number; media: number };
  recent: {
    posts: RecentPost[];
    members: RecentMember[];
    feedback: RecentFeedback[];
  };
};

export function fetchDashboard(signal?: AbortSignal): Promise<ApiResult<DashboardData>> {
  return apiRequest("/api/admin/dashboard", { signal });
}

// ---- Administrator's own profile ----

export function fetchAdminProfile(
  signal?: AbortSignal,
): Promise<ApiResult<{ user: SessionUser; seededFromEnv: boolean }>> {
  return apiRequest("/api/admin/profile", { signal });
}

export function updateAdminProfile(changes: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}): Promise<ApiResult<{ user: SessionUser; passwordChanged: boolean }>> {
  return apiRequest("/api/admin/profile", { method: "PATCH", body: changes });
}
