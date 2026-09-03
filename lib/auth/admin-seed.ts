import "server-only";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth-validation";

/**
 * Administrator bootstrap.
 *
 * Credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and are never
 * hard-coded. The password is bcrypt-hashed before it reaches MongoDB, so no
 * plain-text credential is ever stored.
 *
 * Called at the start of an admin sign-in attempt, which makes first-run setup
 * automatic while keeping the seed idempotent:
 *
 *  - no admin yet -> create the account from the environment
 *  - admin exists -> ensure the `admin` role and an active account; otherwise
 *                    LEAVE IT ALONE
 *
 * The password of an existing account is deliberately never overwritten. The
 * administrator can change their own password in the dashboard, and re-syncing
 * from `ADMIN_PASSWORD` on every sign-in would silently undo that. The
 * environment seeds the account; it does not own it thereafter.
 *
 * To reset a forgotten admin password: delete the user document (or change
 * `ADMIN_EMAIL` to seed a fresh admin), then sign in again.
 */

export type SeedResult =
  | { status: "created"; email: string }
  | { status: "updated"; email: string }
  | { status: "unchanged"; email: string }
  | { status: "skipped"; reason: string };

export function isAdminSeedConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim());
}

export async function ensureAdminUser(): Promise<SeedResult> {
  const rawEmail = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!rawEmail || !password) {
    return {
      status: "skipped",
      reason: "ADMIN_EMAIL and ADMIN_PASSWORD are not both set — see .env.example.",
    };
  }
  if (password.length < 8) {
    return { status: "skipped", reason: "ADMIN_PASSWORD must be at least 8 characters." };
  }

  await connectToDatabase();
  const email = normalizeEmail(rawEmail);

  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      isActive: true,
    });
    return { status: "created", email };
  }

  let changed = false;

  if (existing.role !== "admin") {
    existing.role = "admin";
    changed = true;
  }
  if (!existing.isActive) {
    existing.isActive = true;
    changed = true;
  }

  // The password is intentionally NOT touched here — see the note above.

  if (!changed) return { status: "unchanged", email };

  await existing.save();
  return { status: "updated", email };
}

/**
 * Best-effort seed used on the sign-in path. Never throws — a seeding problem
 * must not turn a sign-in attempt into a 500.
 */
export async function tryEnsureAdminUser(): Promise<void> {
  if (!isAdminSeedConfigured()) return;
  try {
    await ensureAdminUser();
  } catch (error) {
    console.error("[admin-seed] could not ensure the administrator account:", error);
  }
}
