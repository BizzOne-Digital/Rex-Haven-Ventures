import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createSession, toSafeUser } from "@/lib/auth/session";
import { errors, handleRouteError, ok, readJson, requireConfig } from "@/lib/api";
import { clientKey, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import {
  validateSignup,
  hasAuthErrors,
  normalizeEmail,
  type SignupValues,
} from "@/lib/auth-validation";

/**
 * POST /api/auth/signup — create a member account and sign them in.
 *
 * The password is hashed before it touches the database and the response
 * carries only the safe account projection. New accounts are always created
 * with role `member`: a client cannot request `admin`.
 */
export async function POST(request: Request) {
  const configError = requireConfig();
  if (configError) return configError;

  const limit = rateLimit(clientKey(request, "signup"), 8, 10 * 60 * 1000);
  if (!limit.allowed) return errors.rateLimited(limit.retryAfterSeconds);

  const body = await readJson<Partial<SignupValues>>(request);
  if (!body) return errors.badRequest();

  const values: SignupValues = {
    name: sanitizeText(String(body.name ?? "")),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
    confirmPassword: String(body.confirmPassword ?? body.password ?? ""),
  };

  const fieldErrors = validateSignup(values);
  if (hasAuthErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    await connectToDatabase();
    const email = normalizeEmail(values.email);

    if (await User.exists({ email })) {
      // Explicit, because the signup form has to tell people what to do next.
      // Sign-in deliberately stays vague; there is no way to enumerate accounts
      // here that a "forgot password" flow wouldn't also expose.
      return errors.validation(
        { email: "An account with this email already exists. Try signing in instead." },
        "That email is already registered.",
      );
    }

    const created = await User.create({
      name: values.name.trim(),
      email,
      passwordHash: await hashPassword(values.password),
      role: "member",
      isActive: true,
      lastLoginAt: new Date(),
    });

    await createSession(String(created._id), "member");
    resetRateLimit(clientKey(request, "signup"));

    return ok({ ok: true, user: toSafeUser(created) }, 201);
  } catch (error) {
    // Unique-index race: two requests for the same email at the same moment.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.validation(
        { email: "An account with this email already exists. Try signing in instead." },
        "That email is already registered.",
      );
    }
    return handleRouteError(error, "auth/signup");
  }
}
