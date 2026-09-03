"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { Field, TextInput } from "@/components/ui/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { LogOut } from "@/components/ui/Icons";
import { useSession } from "@/components/auth/SessionProvider";
import { fetchAdminProfile, updateAdminProfile } from "@/services/admin";
import { isAbort } from "@/services/api-client";
import type { SessionUser } from "@/services/auth";
import { PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/auth-validation";

/**
 * Administrator profile and security.
 *
 * The email address is shown but not editable here: it is the key the
 * environment seed matches on, so changing it in the UI would quietly create a
 * second admin on the next sign-in. Changing it is an `.env` + re-seed
 * operation, and the screen says so.
 */

type FieldErrors = Partial<
  Record<"name" | "currentPassword" | "newPassword" | "confirmPassword", string>
>;

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminProfile() {
  const router = useRouter();
  const { signOut, refresh } = useSession();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [seededFromEnv, setSeededFromEnv] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchAdminProfile>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setUser(result.data.user);
      setName(result.data.user.name);
      setSeededFromEnv(result.data.seededFromEnv);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAdminProfile(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setActionError(null);
    setErrors({});

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrors({ name: "Please enter at least 2 characters." });
      return;
    }

    setSavingName(true);
    const result = await updateAdminProfile({ name: trimmed });
    setSavingName(false);

    if (!result.ok) {
      setActionError(result.error.message);
      if (result.error.fieldErrors) setErrors(result.error.fieldErrors as FieldErrors);
      return;
    }

    setUser(result.data.user);
    setNotice("Your display name has been updated.");
    // Keep the header's account menu in step.
    await refresh();
    router.refresh();
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setActionError(null);

    const found: FieldErrors = {};
    if (!currentPassword) found.currentPassword = "Please enter your current password.";
    const passwordError = validatePassword(newPassword);
    if (passwordError) found.newPassword = passwordError;
    if (newPassword !== confirmPassword) {
      found.confirmPassword = "Those passwords don't match.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSavingPassword(true);
    const result = await updateAdminProfile({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setSavingPassword(false);

    if (!result.ok) {
      setActionError(result.error.message);
      if (result.error.fieldErrors) setErrors(result.error.fieldErrors as FieldErrors);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setNotice("Your password has been changed. Your session has been renewed.");
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  if (isLoading) return <LoadingBlock label="Loading your profile…" />;

  if (loadError || !user) {
    return (
      <Alert tone="error" title="We couldn't load your profile">
        {loadError ?? "Please try again in a moment."}
      </Alert>
    );
  }

  return (
    <div>
      <div>
        <h2 className="font-serif text-2xl text-ink">Profile &amp; settings</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Your administrator account and its security settings.
        </p>
      </div>

      {notice && (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-6" title="That didn't work">
          {actionError}
        </Alert>
      )}

      {/* Account */}
      <section className="mt-7 rounded-[6px] border border-line bg-cream p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-serif text-lg text-ink">Account</h3>
          <StatusPill tone="brand">Administrator</StatusPill>
        </div>

        <dl className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Email</dt>
            <dd className="mt-1.5 truncate text-[0.95rem] text-charcoal">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Last sign-in</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">
              {formatDateTime(user.lastLoginAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Account created</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">
              {formatDateTime(user.createdAt)}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          {seededFromEnv ? (
            <>
              This account matches <code className="font-mono">ADMIN_EMAIL</code> in your
              environment. To change the address, update that variable and sign in again — a new
              administrator will be created for the new address.
            </>
          ) : (
            <>
              This account was not created from <code className="font-mono">ADMIN_EMAIL</code>.
              It was promoted to administrator from the Members screen.
            </>
          )}
        </p>
      </section>

      {/* Display name */}
      <section className="mt-6 rounded-[6px] border border-line bg-cream p-6 shadow-soft">
        <h3 className="font-serif text-lg text-ink">Display name</h3>
        <form onSubmit={saveName} noValidate className="mt-4 max-w-md">
          <Field id="admin-name" label="Name" error={errors.name}>
            <TextInput
              id="admin-name"
              value={name}
              disabled={savingName}
              hasError={Boolean(errors.name)}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <div className="mt-4">
            <Button type="submit" disabled={savingName || name.trim() === user.name}>
              {savingName ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Saving…
                </span>
              ) : (
                "Save name"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Password */}
      <section className="mt-6 rounded-[6px] border border-line bg-cream p-6 shadow-soft">
        <h3 className="font-serif text-lg text-ink">Change password</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You need your current password to set a new one. Changing it renews your session.
        </p>

        <form onSubmit={savePassword} noValidate className="mt-5 flex max-w-md flex-col gap-5">
          <Field id="currentPassword" label="Current password" error={errors.currentPassword}>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              autoComplete="current-password"
              disabled={savingPassword}
              hasError={Boolean(errors.currentPassword)}
              describedBy={errors.currentPassword ? "currentPassword-error" : undefined}
              onChange={setCurrentPassword}
            />
          </Field>

          <Field
            id="newPassword"
            label="New password"
            error={errors.newPassword}
            description={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
          >
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={newPassword}
              autoComplete="new-password"
              disabled={savingPassword}
              showStrength
              hasError={Boolean(errors.newPassword)}
              describedBy={errors.newPassword ? "newPassword-error" : "newPassword-description"}
              onChange={setNewPassword}
            />
          </Field>

          <Field id="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              autoComplete="new-password"
              disabled={savingPassword}
              hasError={Boolean(errors.confirmPassword)}
              describedBy={errors.confirmPassword ? "confirmPassword-error" : undefined}
              onChange={setConfirmPassword}
            />
          </Field>

          <div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Changing…
                </span>
              ) : (
                "Change password"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* Session */}
      <section className="mt-6 rounded-[6px] border border-line bg-beige-light/50 p-6">
        <h3 className="font-serif text-lg text-ink">Session</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your session is stored in an HttpOnly cookie and expires automatically. Signing out
          clears it immediately.
        </p>
        <div className="mt-5">
          <Button type="button" variant="outline" onClick={handleSignOut} disabled={signingOut}>
            <span className="inline-flex items-center gap-2">
              {signingOut ? <Spinner /> : <LogOut className="h-4 w-4" />}
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}
