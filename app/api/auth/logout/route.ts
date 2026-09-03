import { destroySession } from "@/lib/auth/session";
import { ok } from "@/lib/api";

/**
 * POST /api/auth/logout — clear the session cookie.
 *
 * Always succeeds, whether or not a session was present, so signing out is
 * idempotent and can't fail the UI. POST-only: a GET would let a third-party
 * page sign the user out with an <img> tag.
 */
export async function POST() {
  await destroySession();
  return ok({ ok: true });
}
