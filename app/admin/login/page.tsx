import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert } from "@/components/ui/Alert";
import { LoadingBlock } from "@/components/ui/Spinner";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/mongoose";
import { isAdminSeedConfigured } from "@/lib/auth/admin-seed";

export const metadata: Metadata = {
  title: "Administrator Sign In",
  robots: { index: false, follow: false },
};

/**
 * Administrator sign-in.
 *
 * Sits outside the `(dashboard)` route group so it isn't caught by that group's
 * admin guard. It posts to the same `/api/auth/login` endpoint as member
 * sign-in — there is one credential path, and `requireAdmin` is what decides
 * who may reach the dashboard.
 *
 * The administrator account itself is seeded from `ADMIN_EMAIL` /
 * `ADMIN_PASSWORD` on the first successful sign-in attempt; no credentials are
 * hard-coded anywhere in this codebase.
 */
export default async function AdminLoginPage() {
  const configured = isDatabaseConfigured() && isAuthConfigured();

  // Already an administrator? Skip the form.
  if (configured) {
    const user = await getCurrentUser();
    if (user?.role === "admin") redirect("/admin");
  }

  return (
    <AuthShell
      eyebrow="Administration"
      title={
        <>
          Administrator <span className="accent-italic">sign in</span>.
        </>
      }
      description="Manage published insights, review member contributions, and administer accounts."
      backLink={{ href: "/", label: "Back to the site" }}
      footer={
        <>
          Looking for your member account?{" "}
          <Link href="/login" className="font-medium text-burgundy underline-offset-4 hover:underline">
            Sign in here
          </Link>
          .
        </>
      }
    >
      {!configured ? (
        <Alert tone="warning" title="The dashboard isn't configured yet">
          Set <code className="font-mono text-[0.85em]">MONGODB_URI</code> and{" "}
          <code className="font-mono text-[0.85em]">AUTH_SECRET</code> in{" "}
          <code className="font-mono text-[0.85em]">.env.local</code>, then restart the server.
          See <code className="font-mono text-[0.85em]">.env.example</code> for the full list.
        </Alert>
      ) : (
        <>
          {!isAdminSeedConfigured() && (
            <Alert tone="info" className="mb-6" title="No administrator configured">
              Set <code className="font-mono text-[0.85em]">ADMIN_EMAIL</code> and{" "}
              <code className="font-mono text-[0.85em]">ADMIN_PASSWORD</code> in{" "}
              <code className="font-mono text-[0.85em]">.env.local</code> to create the
              administrator account, then sign in with those credentials.
            </Alert>
          )}
          <Suspense fallback={<LoadingBlock label="Preparing the form…" />}>
            <LoginForm redirectTo="/admin" adminMode />
          </Suspense>
        </>
      )}
    </AuthShell>
  );
}
