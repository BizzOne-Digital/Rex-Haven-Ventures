import { apiRequest, type ApiResult } from "@/services/api-client";
import { GENERIC_ERROR, NETWORK_ERROR } from "@/lib/api-response";
import type { MediaItem } from "@/lib/media-types";

/** Client-side calls for the media library. */

/** Which back end the server is storing uploads in. */
export type MediaStorage = "cloudinary" | "local";

export type MediaLimits = {
  maxBytes: number;
  maxSize: string;
  acceptedTypes: string[];
};

export function fetchMedia(
  signal?: AbortSignal,
): Promise<
  ApiResult<{
    items: MediaItem[];
    total: number;
    totalSize: string;
    storage: MediaStorage;
    limits: MediaLimits;
  }>
> {
  return apiRequest("/api/admin/media", { signal });
}

/**
 * Uploads one image.
 *
 * Hand-rolled rather than routed through `apiRequest`, because the body is
 * `FormData` — setting a JSON Content-Type would break the multipart boundary.
 */
export async function uploadMedia(
  file: File,
  alt?: string,
): Promise<ApiResult<{ media: MediaItem }>> {
  const body = new FormData();
  body.append("file", file);
  if (alt) body.append("alt", alt);

  try {
    const response = await fetch("/api/admin/media", {
      method: "POST",
      credentials: "same-origin",
      body,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error = (payload ?? {}) as {
        code?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
      };
      return {
        ok: false,
        status: response.status,
        error: {
          code: (error.code ?? "server_error") as never,
          message: error.message ?? error.fieldErrors?.file ?? GENERIC_ERROR,
          fieldErrors: error.fieldErrors,
        },
      };
    }

    return { ok: true, data: payload as { media: MediaItem } };
  } catch {
    return {
      ok: false,
      status: 0,
      error: { code: "server_error", message: NETWORK_ERROR },
    };
  }
}

export function updateMedia(
  id: string,
  alt: string,
): Promise<ApiResult<{ media: MediaItem }>> {
  return apiRequest(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { alt },
  });
}

/** `force` deletes even when posts still use the image, clearing them first. */
export function deleteMedia(
  id: string,
  force = false,
): Promise<ApiResult<{ clearedFromPosts: number }>> {
  return apiRequest(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: { force },
  });
}
