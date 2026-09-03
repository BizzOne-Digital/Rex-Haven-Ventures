import { GENERIC_ERROR, NETWORK_ERROR, type ApiError } from "@/lib/api-response";

/**
 * Client-side fetch wrapper shared by the `services/*` modules.
 *
 * Follows the convention `services/contact.ts` established: every call resolves
 * to an explicit success/failure result rather than throwing, so components can
 * render an honest state instead of guessing. Network failure, malformed JSON
 * and a server error are all distinguishable here.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError; status: number };

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      signal,
      // Session lives in an HttpOnly cookie; `same-origin` is the default but
      // being explicit documents the dependency.
      credentials: "same-origin",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error = (payload ?? {}) as Partial<ApiError>;
      return {
        ok: false,
        status: response.status,
        error: {
          code: error.code ?? "server_error",
          message: error.message ?? GENERIC_ERROR,
          fieldErrors: error.fieldErrors,
        },
      };
    }

    return { ok: true, data: (payload ?? {}) as T };
  } catch (error) {
    // An aborted request is a caller-initiated cancellation, not a failure.
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        error: { code: "bad_request", message: "Request cancelled." },
      };
    }
    return {
      ok: false,
      status: 0,
      error: { code: "server_error", message: NETWORK_ERROR },
    };
  }
}

/** True when a failure was a cancelled request, which the UI should ignore. */
export function isAbort(result: ApiResult<unknown>): boolean {
  return !result.ok && result.status === 0 && result.error.message === "Request cancelled.";
}
