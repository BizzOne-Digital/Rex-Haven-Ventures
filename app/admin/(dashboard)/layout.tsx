import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Alert } from "@/components/ui/Alert";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth/session";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { Feedback } from "@/lib/db/models/Feedback";

/**
 * Guarded shell for the admin dashboard.
 *
 * This layout is the server-side gate for every page inside the `(dashboard)`
 * route group. `/admin/login` sits outside the group on purpose, so the sign-in
 * page itself is reachable without already being an administrator.
 *
 * The API routes re-check authorization independently — this guard controls the
 * UI, never the data.
 *
 * The chrome itself is `AdminShell`: a fixed rail plus a separate content
 * panel. The site header and footer are scoped to the `(site)` route group, so
 * nothing from the marketing layout reaches these pages.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Pending count for the nav badge. Never fails the page if it can't be read. */
async function getPendingCount(): Promise<number> {
  try {
    await connectToDatabase();
    return await Feedback.countDocuments({ status: "pending" });
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Configuration first: without a database or a session secret, no session can
  // ever be valid, so say what is missing instead of bouncing to a sign-in page
  // that cannot succeed.
  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    // No site header sits above this any more, so the old header-clearing top
    // padding would just leave a gap.
    return (
      <section className="min-h-screen bg-beige-light py-16 md:py-24">
        <Container size="default">
          <Eyebrow>Administration</Eyebrow>
          <h1 className="display-3 mt-5 text-ink">Setup required</h1>
          <Alert tone="warning" className="mt-8" title="The dashboard isn't configured yet">
            <p>
              Copy <code className="font-mono text-[0.85em]">.env.example</code> to{" "}
              <code className="font-mono text-[0.85em]">.env.local</code> and set the following,
              then restart the server:
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {!isDatabaseConfigured() && (
                <li>
                  <code className="font-mono text-[0.85em]">MONGODB_URI</code> — your MongoDB
                  connection string
                </li>
              )}
              {!isAuthConfigured() && (
                <li>
                  <code className="font-mono text-[0.85em]">AUTH_SECRET</code> — at least 32
                  characters (<code className="font-mono text-[0.85em]">openssl rand -base64 32</code>)
                </li>
              )}
              <li>
                <code className="font-mono text-[0.85em]">ADMIN_EMAIL</code> and{" "}
                <code className="font-mono text-[0.85em]">ADMIN_PASSWORD</code> — the
                administrator account to seed
              </li>
            </ul>
          </Alert>
        </Container>
      </section>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") {
    // Authenticated but not an administrator. Send them somewhere useful rather
    // than showing a dead end.
    redirect("/account?denied=admin");
  }

  const pendingCount = await getPendingCount();

  return (
    <AdminShell
      user={{ name: user.name, email: user.email }}
      pendingCount={pendingCount}
    >
      {children}
    </AdminShell>
  );
}
