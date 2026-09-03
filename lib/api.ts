import "server-only";
import { getCurrentUser, isAuthConfigured, type SafeUser } from "@/lib/auth/session";
import { isDatabaseConfigured, DatabaseUnavailableError } from "@/lib/db/mongoose";
import type { ApiErrorCode } from "@/lib/api-response";

/**
 * Route-handler helpers: consistent JSON envelopes and reusable authorization
 * guards. Every guard returns either the caller's account or a ready-to-return
 * `Response`, so a handler can never accidentally continue past a failed check.
 */

export function ok(body: unknown = { ok: true }, status = 200): Response {
  return Response.json(body, { status });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  fieldErrors?: Record<string, string>,
): Response {
  return Response.json({ code, message, ...(fieldErrors ? { fieldErrors } : {}) }, { status });
}

export const errors = {
  badRequest: (message = "Invalid request body.") => fail("bad_request", message, 400),
  validation: (fieldErrors: Record<string, string>, message = "Please review the highlighted fields.") =>
    fail("validation", message, 400, fieldErrors),
  unauthenticated: (message = "Please sign in to continue.") =>
    fail("unauthenticated", message, 401),
  forbidden: (message = "You don't have permission to do that.") =>
    fail("forbidden", message, 403),
  notFound: (message = "Not found.") => fail("not_found", message, 404),
  conflict: (message: string) => fail("conflict", message, 409),
  unconfigured: (message: string) => fail("unconfigured", message, 503),
  server: (message = "Something went wrong on our end.") => fail("server_error", message, 500),
  /** 429 with a `Retry-After` header so clients can back off correctly. */
  rateLimited: (retryAfterSeconds: number) =>
    Response.json(
      {
        code: "rate_limited" satisfies ApiErrorCode,
        message: `Too many attempts. Please wait ${retryAfterSeconds} seconds and try again.`,
        retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    ),
};

/** Parses a JSON body, returning `null` when it is absent or malformed. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") return null;
    return body as T;
  } catch {
    return null;
  }
}

/**
 * Verifies the server has what it needs before touching the database.
 * Returns a 503 that the UI can render as a setup hint rather than a failure.
 */
export function requireConfig(): Response | null {
  if (!isDatabaseConfigured()) {
    return errors.unconfigured(
      "The database isn't configured yet. Set MONGODB_URI in .env.local — see .env.example.",
    );
  }
  if (!isAuthConfigured()) {
    return errors.unconfigured(
      "Authentication isn't configured yet. Set AUTH_SECRET in .env.local — see .env.example.",
    );
  }
  return null;
}

/** Requires any signed-in, active account. */
export async function requireUser(): Promise<
  { user: SafeUser; response?: never } | { user?: never; response: Response }
> {
  const configError = requireConfig();
  if (configError) return { response: configError };

  const user = await getCurrentUser();
  if (!user) return { response: errors.unauthenticated() };
  return { user };
}

/** Requires an administrator. Members receive 403, not a hint that admin exists. */
export async function requireAdmin(): Promise<
  { user: SafeUser; response?: never } | { user?: never; response: Response }
> {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user.role !== "admin") {
    return { response: errors.forbidden("Administrator access is required.") };
  }
  return { user: result.user };
}

/**
 * Maps a thrown error to a response without leaking internals.
 * Connection problems become an actionable 503; everything else a generic 500.
 */
export function handleRouteError(error: unknown, context: string): Response {
  if (error instanceof DatabaseUnavailableError) {
    console.error(`[${context}] database unavailable:`, error.message);
    return errors.unconfigured(
      "We can't reach the database right now. Please try again in a moment.",
    );
  }
  console.error(`[${context}]`, error);
  return errors.server();
}
