import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { equalizeTiming, verifyPassword } from "@/lib/auth/password";
import { createSession, toSafeUser } from "@/lib/auth/session";
import { tryEnsureAdminUser } from "@/lib/auth/admin-seed";
import { errors, handleRouteError, ok, readJson, requireConfig } from "@/lib/api";
import { clientKey, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import {
  validateLogin,
  hasAuthErrors,
  normalizeEmail,
  type LoginValues,
} from "@/lib/auth-validation";

/**
 * POST /api/auth/login — verify credentials and issue a session cookie.
 *
 * Failures are deliberately indistinguishable from one another: a wrong
 * password, an unknown email and a deactivated-account-with-wrong-password all
 * return the same message, and a missing account still pays the cost of a
 * bcrypt comparison so response timing doesn't leak which emails exist.
 */

const INVALID_CREDENTIALS = "That email and password combination doesn't match our records.";

export async function POST(request: Request) {
  const configError = requireConfig();
  if (configError) return configError;

  const throttleKey = clientKey(request, "login");
  const limit = rateLimit(throttleKey, 10, 10 * 60 * 1000);
  if (!limit.allowed) return errors.rateLimited(limit.retryAfterSeconds);

  const body = await readJson<Partial<LoginValues>>(request);
  if (!body) return errors.badRequest();

  const values: LoginValues = {
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
  };

  const fieldErrors = validateLogin(values);
  if (hasAuthErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    // First-run convenience: create/sync the administrator from the environment
    // before checking credentials, so the configured admin can always sign in.
    await tryEnsureAdminUser();

    await connectToDatabase();
    const email = normalizeEmail(values.email);
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      await equalizeTiming(values.password);
      return errors.validation({ password: INVALID_CREDENTIALS }, INVALID_CREDENTIALS);
    }

    const passwordMatches = await verifyPassword(values.password, user.passwordHash);
    if (!passwordMatches) {
      return errors.validation({ password: INVALID_CREDENTIALS }, INVALID_CREDENTIALS);
    }

    // Only tell a deactivated user their account is disabled once the password
    // has been proven — otherwise this becomes an account-enumeration oracle.
    if (!user.isActive) {
      return errors.forbidden(
        "This account has been deactivated. Please contact us if you think that's a mistake.",
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    await createSession(String(user._id), user.role);
    resetRateLimit(throttleKey);

    return ok({ ok: true, user: toSafeUser(user) });
  } catch (error) {
    return handleRouteError(error, "auth/login");
  }
}
