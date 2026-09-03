"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Field, TextInput } from "@/components/ui/Field";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useSession } from "@/components/auth/SessionProvider";
import { signup } from "@/services/auth";
import {
  emptySignupValues,
  hasAuthErrors,
  PASSWORD_MIN_LENGTH,
  validateSignup,
  type AuthFieldErrors,
  type SignupValues,
} from "@/lib/auth-validation";

/**
 * Member sign-up form.
 *
 * The account is created with the `member` role server-side; nothing here can
 * request anything else. On success the API issues the session cookie straight
 * away, so a new member is signed in without a second step.
 */

type Status = "idle" | "submitting" | "error";

const fieldOrder: (keyof SignupValues)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

function safeRedirect(target: string | null, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  return target;
}

export function SignupForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, refresh } = useSession();

  const [values, setValues] = useState<SignupValues>(emptySignupValues);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignupValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formMessage, setFormMessage] = useState("");

  const submitting = status === "submitting";
  const destination = safeRedirect(searchParams.get("next"), redirectTo);

  const showError = (name: keyof SignupValues) =>
    (touched[name] || submitted) && errors[name] ? errors[name] : undefined;

  function update<K extends keyof SignupValues>(name: K, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted || touched[name]) setErrors(validateSignup(next));
    if (status === "error") {
      setStatus("idle");
      setFormMessage("");
    }
  }

  function handleBlur(name: keyof SignupValues) {
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors(validateSignup(values));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateSignup(values);
    setErrors(found);
    setSubmitted(true);

    if (hasAuthErrors(found)) {
      const first = fieldOrder.find((field) => found[field]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    setFormMessage("");

    const result = await signup(values);

    if (!result.ok) {
      setStatus("error");
      setFormMessage(result.error.message);
      if (result.error.fieldErrors) {
        setErrors((current) => ({ ...current, ...result.error.fieldErrors }));
        const firstServerField = fieldOrder.find(
          (field) => result.error.fieldErrors?.[field],
        );
        if (firstServerField) document.getElementById(firstServerField)?.focus();
      }
      return;
    }

    setUser(result.data.user);
    await refresh();
    router.replace(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status === "error" && formMessage && (
        <Alert tone="error" title="We couldn't create your account">
          {formMessage}
        </Alert>
      )}

      <Field id="name" label="Full name" error={showError("name")}>
        <TextInput
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={values.name}
          disabled={submitting}
          hasError={Boolean(showError("name"))}
          aria-invalid={Boolean(showError("name")) || undefined}
          aria-describedby={showError("name") ? "name-error" : undefined}
          onChange={(event) => update("name", event.target.value)}
          onBlur={() => handleBlur("name")}
        />
      </Field>

      <Field
        id="email"
        label="Email address"
        error={showError("email")}
        description="We use this to sign you in. We never publish it alongside your contributions."
      >
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
          aria-describedby={showError("email") ? "email-error" : "email-description"}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => handleBlur("email")}
        />
      </Field>

      <Field
        id="password"
        label="Password"
        error={showError("password")}
        description={`At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number.`}
      >
        <PasswordInput
          id="password"
          name="password"
          value={values.password}
          disabled={submitting}
          autoComplete="new-password"
          placeholder="Choose a password"
          showStrength
          hasError={Boolean(showError("password"))}
          describedBy={showError("password") ? "password-error" : "password-description"}
          onChange={(value) => update("password", value)}
          onBlur={() => handleBlur("password")}
        />
      </Field>

      <Field id="confirmPassword" label="Confirm password" error={showError("confirmPassword")}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          value={values.confirmPassword}
          disabled={submitting}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          hasError={Boolean(showError("confirmPassword"))}
          describedBy={showError("confirmPassword") ? "confirmPassword-error" : undefined}
          onChange={(value) => update("confirmPassword", value)}
          onBlur={() => handleBlur("confirmPassword")}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={submitting} className="mt-2">
        {submitting ? (
          <span className="inline-flex items-center gap-2.5">
            <Spinner />
            Creating your account…
          </span>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
