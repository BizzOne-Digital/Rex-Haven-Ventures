import Link from "next/link";
import type { ReactNode } from "react";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { ArrowRight } from "@/components/ui/Icons";
import { formatArticleDate } from "@/lib/articles";
import type { RecentFeedback, RecentMember, RecentPost } from "@/services/admin";

/**
 * Recent-activity panels for the dashboard.
 *
 * Read-only summaries: each row links through to the screen where the item can
 * actually be acted on, rather than duplicating controls here.
 */

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-[6px] border border-line bg-cream">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h3 className="font-serif text-lg text-ink">{title}</h3>
        {action && (
          <Link
            href={action.href}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-burgundy"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </header>
      <div className="min-w-0 flex-1 px-5 py-2">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentPosts({ posts }: { posts: RecentPost[] }) {
  return (
    <Panel title="Recently published" action={{ href: "/admin/blog", label: "All posts" }}>
      {posts.length === 0 ? (
        <Empty>No published posts yet.</Empty>
      ) : (
        <ul className="min-w-0 divide-y divide-line">
          {posts.map((post) => (
            <li key={post.id} className="min-w-0 py-3.5">
              <Link
                href={`/admin/blog/${post.id}`}
                className="group flex min-w-0 items-start justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-burgundy">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {post.category} &middot; {formatArticleDate(post.date)}
                  </span>
                </span>
                <StatusPill tone={statusTone(post.status)}>
                  {post.status === "published" ? "Live" : "Draft"}
                </StatusPill>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentMembers({ members }: { members: RecentMember[] }) {
  return (
    <Panel title="Newest members" action={{ href: "/admin/users", label: "All members" }}>
      {members.length === 0 ? (
        <Empty>No accounts registered yet.</Empty>
      ) : (
        <ul className="min-w-0 divide-y divide-line">
          {members.map((member) => (
            <li key={member.id} className="flex min-w-0 items-start justify-between gap-3 py-3.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {member.name}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">{member.email}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted">{relativeDate(member.createdAt)}</span>
                {!member.isActive && <StatusPill tone="rejected">Off</StatusPill>}
                {member.role === "admin" && <StatusPill tone="brand">Admin</StatusPill>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentSubmissions({ items }: { items: RecentFeedback[] }) {
  return (
    <Panel
      title="Latest submissions"
      action={{ href: "/admin/feedback", label: "Moderation" }}
    >
      {items.length === 0 ? (
        <Empty>No contributions submitted yet.</Empty>
      ) : (
        <ul className="min-w-0 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="min-w-0 py-3.5">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {item.authorName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    on {item.postTitle}
                  </span>
                </span>
                <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                {item.excerpt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
