"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { RefreshCw } from "@/components/ui/Icons";
import { StatCard } from "@/components/admin/StatCard";
import {
  fetchDashboard,
  importBuiltInPosts,
  type DashboardData,
} from "@/services/admin";
import {
  RecentMembers,
  RecentPosts,
  RecentSubmissions,
} from "@/components/admin/RecentActivity";
import { isAbort } from "@/services/api-client";

/**
 * Dashboard overview.
 *
 * Fetches its own numbers on the client so the panel can be refreshed without a
 * full navigation, and so a database hiccup degrades to a retryable error
 * rather than an error page.
 */
export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchDashboard>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => {
    apply(await fetchDashboard());
  }, [apply]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchDashboard(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    const result = await importBuiltInPosts();
    setImporting(false);

    if (!result.ok) {
      setImportError(result.error.message);
      return;
    }

    const { imported, skipped } = result.data;
    setImportResult(
      imported === 0
        ? `Nothing to import — all ${skipped} built-in articles are already in the database.`
        : `Imported ${imported} article${imported === 1 ? "" : "s"}${
            skipped > 0 ? `, skipped ${skipped} already present` : ""
          }.`,
    );
    await load();
  }

  if (error) {
    return (
      <Alert
        tone="error"
        title="We couldn't load the dashboard"
        action={
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void load();
            }}
            className="text-sm font-medium underline underline-offset-4"
          >
            Retry
          </button>
        }
      >
        {error}
      </Alert>
    );
  }

  const stats = data?.stats ?? null;
  const noPostsYet = stats !== null && stats.posts.total === 0;

  return (
    <div>
      {/* Moderation — the figure that needs acting on */}
      <section aria-labelledby="stats-moderation">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="stats-moderation" className="font-serif text-2xl text-ink">
            Member contributions
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy disabled:opacity-60"
          >
            {isLoading ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Awaiting review"
            value={stats?.feedback.pending ?? 0}
            tone={(stats?.feedback.pending ?? 0) > 0 ? "attention" : "default"}
            hint={
              (stats?.feedback.pending ?? 0) > 0
                ? "These are not visible to the public yet."
                : "Nothing waiting on you."
            }
            href="/admin/feedback"
            linkLabel="Review queue"
            isLoading={isLoading}
          />
          <StatCard
            label="Published"
            value={stats?.feedback.approved ?? 0}
            tone="positive"
            hint="Approved and visible on their articles."
            isLoading={isLoading}
          />
          <StatCard
            label="Not published"
            value={stats?.feedback.rejected ?? 0}
            tone="muted"
            hint="Reviewed and declined."
            isLoading={isLoading}
          />
          <StatCard
            label="Total submissions"
            value={stats?.feedback.total ?? 0}
            hint="All contributions ever received."
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Content and accounts */}
      <section aria-labelledby="stats-content" className="mt-12">
        <h2 id="stats-content" className="font-serif text-2xl text-ink">
          Content &amp; accounts
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Blog posts"
            value={stats?.posts.total ?? 0}
            hint={`${stats?.posts.published ?? 0} published · ${stats?.posts.drafts ?? 0} draft`}
            href="/admin/blog"
            linkLabel="Manage blog"
            isLoading={isLoading}
          />
          <StatCard
            label="Registered users"
            value={stats?.users.total ?? 0}
            hint={`${stats?.users.active ?? 0} active · ${stats?.users.admins ?? 0} administrator${
              (stats?.users.admins ?? 0) === 1 ? "" : "s"
            }`}
            href="/admin/users"
            linkLabel="Manage users"
            isLoading={isLoading}
          />
          <StatCard
            label="Members"
            value={stats?.users.members ?? 0}
            hint="Accounts that can contribute to the blog."
            isLoading={isLoading}
          />
          <StatCard
            label="Deactivated"
            value={Math.max(0, (stats?.users.total ?? 0) - (stats?.users.active ?? 0))}
            tone="muted"
            hint="Cannot sign in or contribute."
            isLoading={isLoading}
          />
          <StatCard
            label="Categories"
            value={stats?.categories ?? 0}
            hint="Used to organise the blog."
            href="/admin/categories"
            linkLabel="Manage categories"
            isLoading={isLoading}
          />
          <StatCard
            label="Media"
            value={stats?.media ?? 0}
            hint="Images available for featured images."
            href="/admin/media"
            linkLabel="Media library"
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Recent activity */}
      <section aria-labelledby="recent-activity" className="mt-12">
        <h2 id="recent-activity" className="font-serif text-2xl text-ink">
          Recent activity
        </h2>

        {isLoading ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-[6px] border border-line bg-beige-light/40"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <RecentPosts posts={data?.recent.posts ?? []} />
            <RecentSubmissions items={data?.recent.feedback ?? []} />
            <RecentMembers members={data?.recent.members ?? []} />
          </div>
        )}
      </section>

      {/* First-run import */}
      {noPostsYet && (
        <section className="mt-12">
          <Alert tone="info" title="Bring the existing articles into the database">
            <p className="leading-relaxed">
              The blog is currently serving the built-in articles from{" "}
              <code className="font-mono text-[0.85em]">lib/articles.ts</code>. Import them once
              and you can edit, unpublish and add to them from here. Existing slugs are never
              overwritten, so this is safe to run more than once.
            </p>
            <div className="mt-4">
              <Button type="button" onClick={() => void handleImport()} disabled={importing}>
                {importing ? (
                  <span className="inline-flex items-center gap-2.5">
                    <Spinner />
                    Importing…
                  </span>
                ) : (
                  "Import built-in articles"
                )}
              </Button>
            </div>
          </Alert>
        </section>
      )}

      {importResult && (
        <Alert tone="success" className="mt-6">
          {importResult}
        </Alert>
      )}
      {importError && (
        <Alert tone="error" className="mt-6" title="The import didn't complete">
          {importError}
        </Alert>
      )}
    </div>
  );
}
