import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { LoadingBlock } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Create an Account",
  description:
    "Create a Rex Haven Ventures member account to offer feedback and share your own insights on our published perspectives.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Become a Member"
      title={
        <>
          Join the <span className="accent-italic">conversation</span>.
        </>
      }
      description="A member account lets you offer feedback on what we publish and share insights of your own. Contributions are reviewed before they appear, so the discussion stays considered."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-burgundy underline-offset-4 hover:underline">
            Sign in
          </Link>
          .
        </>
      }
    >
      <Suspense fallback={<LoadingBlock label="Preparing the form…" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
