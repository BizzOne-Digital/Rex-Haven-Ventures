import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { Alert } from "@/components/ui/Alert";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { ArrowRight } from "@/components/ui/Icons";
import { getCurrentUser, toSafeUser, type SafeUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/db/models/User";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { toAdminFeedback } from "@/lib/feedback-view";
import type { AdminFeedback } from "@/lib/feedback-types";
import { feedbackKindLabels, type FeedbackKindValue } from "@/lib/blog-schema";

export const metadata: Metadata = {
  title: "Member",
  robots: { index: false, follow: false },
};

/**
 * A single member's details and full contribution history.
 *
 * Read-only by design: activate/deactivate/role/delete all live on the Members
 * list, so there is one place those actions happen and one place to reason about
 * their guards. This screen answers "who is this and what have they written?".
 *
 * No password material is read or rendered — `passwordHash` is `select: false`
 * and `toSafeUser` never touches it.
 */

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

function kindLabel(kind: string): string {
  return feedbackKindLabels[kind as FeedbackKindValue] ?? "Contribution";
}

export default async function AdminUserDetailPage({
  params,
}: PageProps<"/admin/users/[id]">) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  let loaded: { user: SafeUser; submissions: AdminFeedback[] } | null = null;

  try {
    await connectToDatabase();
    // `.lean()` keeps these plain objects, safe to render and to hand onward.
    const user = await User.findById(id).lean<UserDocument | null>();

    if (user) {
      const submissions = await Feedback.find({ author: user._id })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean<FeedbackDocument[]>();

      loaded = {
        user: toSafeUser(user),
        submissions: submissions.map(toAdminFeedback),
      };
    }
  } catch {
    return (
      <Alert tone="error" title="We couldn't load this member">
        The database is unreachable right now. Please try again in a moment.
      </Alert>
    );
  }

  if (!loaded) notFound();

  const { user, submissions } = loaded;

  const counts = submissions.reduce(
    (acc, item) => {
      if (item.status === "pending") acc.pending += 1;
      else if (item.status === "approved") acc.approved += 1;
      else if (item.status === "rejected") acc.rejected += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 },
  );

  return (
    <div>
      <Link
        href="/admin/users"
        className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy"
      >
        <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
        All members
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl text-ink">{user.name}</h2>
          <p className="mt-1.5 truncate text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={user.role === "admin" ? "brand" : "neutral"}>
            {user.role}
          </StatusPill>
          <StatusPill tone={user.isActive ? "approved" : "rejected"}>
            {user.isActive ? "Active" : "Deactivated"}
          </StatusPill>
        </div>
      </div>

      {!user.isActive && (
        <Alert tone="warning" className="mt-6" title="This account is deactivated">
          They cannot sign in, and cannot submit new feedback or insights. Their approved
          contributions remain published. Reactivate from the{" "}
          <Link href="/admin/users" className="font-medium underline underline-offset-4">
            Members list
          </Link>
          .
        </Alert>
      )}

      {/* Details */}
      <section className="mt-7 rounded-[6px] border border-line bg-cream p-6 shadow-soft">
        <h3 className="font-serif text-lg text-ink">Account</h3>
        <dl className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Registered</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">
              {formatDateTime(user.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Last sign-in</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">
              {formatDateTime(user.lastLoginAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Submissions</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">{submissions.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Breakdown</dt>
            <dd className="mt-1.5 text-[0.95rem] text-charcoal">
              {counts.approved} published &middot; {counts.pending} pending &middot;{" "}
              {counts.rejected} declined
            </dd>
          </div>
        </dl>
      </section>

      {/* Contributions */}
      <section className="mt-8">
        <h3 className="font-serif text-lg text-ink">Contribution history</h3>

        {submissions.length === 0 ? (
          <p className="mt-4 rounded-[6px] border border-line bg-beige-light/60 px-6 py-10 text-center text-sm text-muted">
            This member hasn&rsquo;t submitted anything yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {submissions.map((item) => (
              <li
                key={item.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${item.postSlug}`}
                      className="text-sm font-medium text-ink transition-colors hover:text-burgundy"
                    >
                      {item.postTitle}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {kindLabel(item.kind)} &middot; {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
                </div>

                <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal/85">
                  {item.body}
                </p>

                {item.moderationNote && (
                  <p className="mt-3 rounded-[4px] border border-line bg-beige-light/60 p-3 text-xs leading-relaxed text-muted">
                    <span className="font-medium text-charcoal">Note to member:</span>{" "}
                    {item.moderationNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-sm text-muted">
          Moderate these from the{" "}
          <Link
            href="/admin/feedback"
            className="font-medium text-burgundy underline-offset-4 hover:underline"
          >
            Feedback &amp; Insights
          </Link>{" "}
          queue.
        </p>
      </section>
    </div>
  );
}
