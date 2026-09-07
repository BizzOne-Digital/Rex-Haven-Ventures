import { GENERIC_ERROR, NETWORK_ERROR } from "@/lib/api-response";
import type { ApiResult } from "@/services/api-client";
import type { UploadFolder, UploadResult } from "@/lib/upload-types";

/**
 * Client-side call for `/api/upload`.
 *
 * Hand-rolled rather than routed through `apiRequest` for the same reason the
 * media upload is: the body is `FormData`, and setting a JSON content type
 * would destroy the multipart boundary.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
  signal?: AbortSignal,
): Promise<ApiResult<UploadResult>> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body,
      signal,
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

    return { ok: true, data: payload as UploadResult };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, error: { code: "bad_request", message: "Upload cancelled." } };
    }
    return { ok: false, status: 0, error: { code: "server_error", message: NETWORK_ERROR } };
  }
}
