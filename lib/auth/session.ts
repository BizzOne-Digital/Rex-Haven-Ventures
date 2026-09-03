import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User, type UserRole } from "@/lib/db/models/User";

/**
 * Stateless session handling, per the Next.js authentication guide.
 *
 * The session is a signed (HS256) JWT in an HttpOnly cookie. The payload holds
 * only an account id and role — never a name, email, password or hash — so a
 * leaked cookie discloses nothing on its own, and role changes are re-checked
 * against the database on every authenticated request.
 */

export const SESSION_COOKIE = "rhv_session";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: string;
};

/** Public shape of an account. Contains no credential material. */
export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

function sessionMaxAgeMs(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS ?? 7);
  const safeDays = Number.isFinite(days) && days > 0 && days <= 365 ? days : 7;
  return safeDays * 24 * 60 * 60 * 1000;
}

/**
 * The signing secret.
 *
 * `AUTH_SECRET` is the documented name. `NEXTAUTH_SECRET` and `SESSION_SECRET`
 * are accepted as aliases so an environment already configured under either
 * name keeps working without an edit.
 */
function readSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim()
  );
}

function encodedKey(): Uint8Array {
  const secret = readSecret();

  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` — see .env.example.",
    );
  }
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

/** True when a session secret is configured. Lets callers fail politely. */
export function isAuthConfigured(): boolean {
  const secret = readSecret();
  return Boolean(secret && secret.length >= 32);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(encodedKey());
}

export async function decryptSession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey(), { algorithms: ["HS256"] });
    const { userId, role, expiresAt } = payload as Partial<SessionPayload>;
    if (typeof userId !== "string" || typeof role !== "string") return null;
    return { userId, role: role as UserRole, expiresAt: String(expiresAt ?? "") };
  } catch {
    // Expired, tampered with, or signed by a rotated secret — all mean "no session".
    return null;
  }
}

/** Issues the session cookie. `secure` is off in dev so http://localhost works. */
export async function createSession(userId: string, role: UserRole): Promise<void> {
  const expiresAt = new Date(Date.now() + sessionMaxAgeMs());
  const token = await encryptSession({ userId, role, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export function toSafeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}): SafeUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

/**
 * Resolves the signed-in account, or `null`.
 *
 * The account is re-read from the database rather than trusted from the cookie,
 * so deactivating or deleting a user takes effect immediately even while they
 * still hold a valid token. Never returns `passwordHash` — the field is
 * `select: false` on the schema.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(session.userId).lean();
    if (!user || !user.isActive) return null;
    return toSafeUser(user);
  } catch {
    // Database down: treat as unauthenticated rather than crashing the page.
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
