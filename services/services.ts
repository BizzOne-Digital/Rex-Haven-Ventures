import { apiRequest, type ApiResult } from "@/services/api-client";
import type { AdminService, PublicService } from "@/lib/service-types";
import type { ServiceValues } from "@/lib/service-validation";

/** Client-side calls for services. */

/** Public: published services only. */
export function fetchPublicServices(
  signal?: AbortSignal,
): Promise<ApiResult<{ items: PublicService[]; total: number }>> {
  return apiRequest("/api/services", { signal });
}

/** Admin: every service, drafts included. */
export function fetchServices(
  signal?: AbortSignal,
): Promise<ApiResult<{ items: AdminService[]; total: number }>> {
  return apiRequest("/api/services?detail=1", { signal });
}

export function createService(
  values: ServiceValues,
): Promise<ApiResult<{ service: AdminService }>> {
  return apiRequest("/api/services", { method: "POST", body: values });
}

/**
 * Partial update. Sending a single field is supported, which is what the
 * list's "show on homepage" and "published" toggles use.
 */
export function updateService(
  id: string,
  values: Partial<ServiceValues>,
): Promise<ApiResult<{ service: AdminService }>> {
  return apiRequest(`/api/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: values,
  });
}

export function deleteService(id: string): Promise<ApiResult<{ ok: true }>> {
  return apiRequest(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Imports the built-in services. Idempotent — existing slugs are skipped. */
export function seedServices(): Promise<ApiResult<{ seeded: number }>> {
  return apiRequest("/api/services?seed=1", { method: "POST", body: {} });
}
