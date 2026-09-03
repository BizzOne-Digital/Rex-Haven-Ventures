import { apiRequest, type ApiResult } from "@/services/api-client";
import type { AdminCategory } from "@/lib/category-types";
import type { CategoryValues } from "@/lib/category-validation";

/** Client-side calls for blog categories. */

/** Public: category names only, for the blog filter row. */
export function fetchCategoryNames(
  signal?: AbortSignal,
): Promise<ApiResult<{ items: string[]; total: number }>> {
  return apiRequest("/api/categories", { signal });
}

/** Admin: full records with post counts. */
export function fetchCategories(
  signal?: AbortSignal,
): Promise<ApiResult<{ items: AdminCategory[]; total: number }>> {
  return apiRequest("/api/categories?detail=1", { signal });
}

export function createCategory(
  values: CategoryValues,
): Promise<ApiResult<{ category: AdminCategory }>> {
  return apiRequest("/api/categories", { method: "POST", body: values });
}

export function updateCategory(
  id: string,
  values: Partial<CategoryValues>,
): Promise<ApiResult<{ category: AdminCategory; reassignedPosts: number }>> {
  return apiRequest(`/api/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: values,
  });
}

/**
 * Deletes a category. `reassignTo` names the category to move existing posts
 * to; without it, the server refuses while any post still uses this one.
 */
export function deleteCategory(
  id: string,
  reassignTo?: string,
): Promise<ApiResult<{ reassignedPosts: number; reassignedTo: string | null }>> {
  return apiRequest(`/api/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: reassignTo ? { reassignTo } : {},
  });
}
