"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Field, TextInput } from "@/components/ui/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useSession } from "@/components/auth/SessionProvider";
import { login } from "@/services/auth";
import {
  emptyLoginValues,
  hasAuthErrors,
  validateLogin,
  type AuthFieldErrors,
  type LoginValues,
} from "@/lib/auth-validation";

/**
 * Member sign-in form.
 *
 * Validates on the client for fast feedback, then re-validates on the server —
 * the client pass is a convenience, never the control. `requireAdmin` decides
 * whether an account may reach `/admin`; this form only signs people in.
 */

type Status = "idle" | "submitting" | "error";

const fieldOrder: (keyof LoginValues)[] = ["email", "password"];

/** Only accept same-site paths, so `?next=` can't become an open redirect. */
function safeRedirect(target: string | null, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  return target;
}

export function LoginForm({
  /** Where to land after signing in. Overridden by a safe `?next=` parameter. */
  redirectTo = "/account",
  /** Copy shown when an administrator is signing in specifically. */
  adminMode = false,
}: {
  redirectTo?: string;
  adminMode?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, refresh } = useSession();

  const [values, setValues] = useState<LoginValues>(emptyLoginValues);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formMessage, setFormMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const submitting = status === "submitting";
  const destination = safeRedirect(searchParams.get("next"), redirectTo);

  const showError = (name: keyof LoginValues) =>
    (touched[name] || submitted) && errors[name] ? errors[name] : undefined;

  function update<K extends keyof LoginValues>(name: K, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted || touched[name]) setErrors(validateLogin(next));
    if (status === "error") {
      setStatus("idle");
      setFormMessage("");
    }
  }

  function handleBlur(name: keyof LoginValues) {
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors(validateLogin(values));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setSubmitted(true);
    setNotice(null);

    if (hasAuthErrors(found)) {
      const first = fieldOrder.find((field) => found[field]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    setFormMessage("");

    const result = await login(values);

    if (!result.ok) {
      setStatus("error");
      setFormMessage(result.error.message);
      if (result.error.fieldErrors) {
        setErrors((current) => ({ ...current, ...result.error.fieldErrors }));
      }
      return;
    }

    const signedIn = result.data.user;
    setUser(signedIn);

    if (adminMode && signedIn.role !== "admin") {
      // Signed in successfully, but not as an administrator. Say so plainly
      // rather than bouncing them off a guarded page with no explanation.
      setStatus("idle");
      setNotice(
        "You are signed in, but this account does not have administrator access.",
      );
      return;
    }

    // Re-read the session so every consumer sees the same source of truth,
    // then hand over to the server-rendered destination.
    await refresh();
    router.replace(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status === "error" && formMessage && (
        <Alert tone="error" title="We couldn't sign you in">
          {formMessage}
        </Alert>
      )}

      {notice && (
        <Alert tone="warning" title="Not an administrator account">
          {notice}{" "}
          <Link href="/account" className="font-medium underline underline-offset-4">
            Go to your account
          </Link>
          .
        </Alert>
      )}

      <Field id="email" label="Email address" error={showError("email")}>
        <TextInput
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={values.email}
          disabled={submitting}
          hasError={Boolean(showError("email"))}
          aria-invalid={Boolean(showError("email")) || undefined}
          aria-describedby={showError("email") ? "email-error" : undefined}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => handleBlur("email")}
        />
      </Field>

      <Field
        id="password"
        label="Password"
        error={showError("password")}
        hint={
          <Link
            href="/contact"
            className="text-burgundy underline-offset-4 hover:underline"
          >
            Trouble signing in?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          value={values.password}
          disabled={submitting}
          autoComplete="current-password"
          placeholder="Your password"
          hasError={Boolean(showError("password"))}
          describedBy={showError("password") ? "password-error" : undefined}
          onChange={(value) => update("password", value)}
          onBlur={() => handleBlur("password")}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
        {submitting ? (
          <span className="inline-flex items-center gap-2.5">
            <Spinner />
            Signing in…
          </span>
        ) : adminMode ? (
          "Sign in to the dashboard"
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
