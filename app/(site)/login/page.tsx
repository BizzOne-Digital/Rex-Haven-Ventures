import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingBlock } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Rex Haven Ventures member account to share feedback and insights on our published perspectives.",
  alternates: { canonical: "/login" },
  // Nothing here should be indexed or followed into the member area.
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Member Access"
      title={
        <>
          Welcome <span className="accent-italic">back</span>.
        </>
      }
      description="Sign in to contribute your perspective to our published insights, and to follow the status of anything you have submitted."
      footer={
        <>
          Don&rsquo;t have an account yet?{" "}
          <Link href="/signup" className="font-medium text-burgundy underline-offset-4 hover:underline">
            Create one
          </Link>
          .
        </>
      }
    >
      {/* LoginForm reads `?next=`, so it needs a Suspense boundary. */}
      <Suspense fallback={<LoadingBlock label="Preparing the form…" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
