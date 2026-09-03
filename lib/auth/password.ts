import "server-only";
import bcrypt from "bcryptjs";

/**
 * Password hashing.
 *
 * bcrypt with a per-password salt and a work factor of 12 — high enough to make
 * offline cracking expensive, low enough to keep sign-in responsive. Plain-text
 * passwords exist only inside a single request and are never persisted, logged
 * or returned.
 */

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // A malformed stored hash must read as "wrong password", never as a crash.
    return false;
  }
}

/**
 * Constant-ish-time dummy comparison.
 *
 * Run when no account matches the submitted email so that a failed sign-in
 * costs roughly the same as a successful one. Without it, response timing
 * reveals which email addresses are registered.
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.CkPU5zLtGN0YCJyBLBS1FzHRnZ1Efqe";

export async function equalizeTiming(plain: string): Promise<void> {
  try {
    await bcrypt.compare(plain || "placeholder", DUMMY_HASH);
  } catch {
    // Nothing to do — this call exists purely to burn a comparable amount of time.
  }
}
