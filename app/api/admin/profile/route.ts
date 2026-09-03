import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, toSafeUser } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth-validation";
import { sanitizeText } from "@/lib/sanitize";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "@/lib/auth-validation";

/**
 * Administrator's own profile.
 *
 *   GET   /api/admin/profile — email, name, last sign-in
 *   PATCH /api/admin/profile — change display name and/or password
 *
 * Changing a password requires the current one, even though the caller is
 * already authenticated: it stops someone with a borrowed session from locking
 * the real owner out.
 *
 * A password changed here sticks: the environment seed creates the admin
 * account but never overwrites an existing password (see lib/auth/admin-seed.ts).
 */

export async function GET() {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const seededFromEnv =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() === user.email.toLowerCase();

  return ok({ user, seededFromEnv });
}

type UpdateBody = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export async function PATCH(request: Request) {
  const { user: admin, response } = await requireAdmin();
  if (response) return response;

  const body = await readJson<UpdateBody>(request);
  if (!body) return errors.badRequest();

  const wantsPasswordChange = Boolean(body.newPassword);
  const wantsNameChange = typeof body.name === "string";

  if (!wantsPasswordChange && !wantsNameChange) {
    return errors.badRequest("Nothing to update.");
  }

  try {
    await connectToDatabase();
    const user = await User.findById(admin.id).select("+passwordHash");
    if (!user) return errors.notFound("We couldn't find your account.");

    if (wantsNameChange) {
      const name = sanitizeText(String(body.name)).trim();
      if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
        return errors.validation({
          name: `Please enter a name between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`,
        });
      }
      user.name = name;
    }

    let passwordChanged = false;

    if (wantsPasswordChange) {
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword ?? "");
      const confirmPassword = String(body.confirmPassword ?? "");

      if (!currentPassword) {
        return errors.validation({
          currentPassword: "Please enter your current password.",
        });
      }
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        return errors.validation({
          currentPassword: "That doesn't match your current password.",
        });
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) return errors.validation({ newPassword: passwordError });

      if (newPassword !== confirmPassword) {
        return errors.validation({ confirmPassword: "Those passwords don't match." });
      }
      if (newPassword === currentPassword) {
        return errors.validation({
          newPassword: "Please choose a password different from your current one.",
        });
      }

      user.passwordHash = await hashPassword(newPassword);
      passwordChanged = true;
    }

    await user.save();

    // Re-issue the session so the cookie's lifetime restarts on a credential change.
    if (passwordChanged) await createSession(String(user._id), user.role);

    return ok({ ok: true, user: toSafeUser(user), passwordChanged });
  } catch (error) {
    return handleRouteError(error, "admin/profile/update");
  }
}
