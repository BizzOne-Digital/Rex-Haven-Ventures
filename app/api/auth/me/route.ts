import { getCurrentUser } from "@/lib/auth/session";
import { handleRouteError, ok } from "@/lib/api";

/**
 * GET /api/auth/me — the currently authenticated account, or `null`.
 *
 * Never 401s: "signed out" is a normal answer to this question, and the client
 * uses it to decide what to render. The payload is the safe projection only —
 * no password hash, ever.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return ok({ user });
  } catch (error) {
    return handleRouteError(error, "auth/me");
  }
}
