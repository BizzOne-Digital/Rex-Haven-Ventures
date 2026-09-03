"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { TextArea, TextInput } from "@/components/ui/Field";
import {
  ArrowRight,
  Check,
  Close,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Search,
  Trash,
} from "@/components/ui/Icons";
import {
  deleteFeedback,
  fetchAdminFeedback,
  moderateFeedback,
  type FeedbackQuery,
} from "@/services/admin";
import { isAbort } from "@/services/api-client";
import type { AdminFeedback, FeedbackCounts } from "@/lib/feedback-types";
import { feedbackKindLabels, type FeedbackKindValue } from "@/lib/blog-schema";

/**
 * Moderation queue.
 *
 * Every submission arrives as `pending` and stays invisible to the public until
 * approved here. Approving or rejecting also revalidates the article page
 * server-side, so the public view matches the decision immediately.
 *
 * Rejection can carry a short note, which the member sees on their account page
 * — a decline with a reason is far more useful than a silent one.
 */

type Filter = "all" | "pending" | "approved" | "rejected";

const filters: { value: Filter; label: string; countKey?: keyof FeedbackCounts }[] = [
  { value: "pending", label: "Pending", countKey: "pending" },
  { value: "approved", label: "Approved", countKey: "approved" },
  { value: "rejected", label: "Rejected", countKey: "rejected" },
  { value: "all", label: "All", countKey: "total" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function kindLabel(kind: string): string {
  return feedbackKindLabels[kind as FeedbackKindValue] ?? "Contribution";
}

export function ModerationQueue() {
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchAdminFeedback>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setItems(result.data.items);
      setCounts(result.data.counts);
      setTotalPages(result.data.totalPages);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  const load = useCallback(
    async (query: FeedbackQuery) => {
      apply(await fetchAdminFeedback(query));
    },
    [apply],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchAdminFeedback(
      { status: filter, q: debouncedSearch, page },
      controller.signal,
    ).then(apply);
    return () => controller.abort();
  }, [apply, filter, debouncedSearch, page]);

  function refresh() {
    setIsRefreshing(true);
    void load({ status: filter, q: debouncedSearch, page });
  }

  async function applyStatus(
    submission: AdminFeedback,
    status: "pending" | "approved" | "rejected",
    note?: string,
  ) {
    setBusyId(submission.id);
    setActionError(null);
    setActionNotice(null);

    const result = await moderateFeedback(submission.id, status, note);
    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setRejectingId(null);
    setRejectNote("");

    const verb =
      status === "approved" ? "approved and published" : status === "rejected" ? "declined" : "returned to the queue";
    setActionNotice(`${submission.authorName}'s contribution was ${verb}.`);

    // Re-fetch so the counts and the current filter stay accurate.
    void load({ status: filter, q: debouncedSearch, page });
  }

  async function remove(submission: AdminFeedback) {
    setBusyId(submission.id);
    setActionError(null);
    setActionNotice(null);

    const result = await deleteFeedback(submission.id);
    setBusyId(null);
    setConfirmDeleteId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setActionNotice("The contribution was deleted.");
    void load({ status: filter, q: debouncedSearch, page });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Feedback &amp; insights</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Nothing here is publicly visible until you approve it. Approved contributions appear
            on their article straight away.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy disabled:opacity-60"
        >
          {isRefreshing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Filters + search */}
      <div className="mt-7 flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by moderation status">
          {filters.map((option) => {
            const active = filter === option.value;
            const count = option.countKey ? counts[option.countKey] : undefined;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
                  active
                    ? "border-burgundy bg-burgundy text-cream"
                    : "border-line text-muted hover:border-burgundy/40 hover:text-burgundy",
                )}
              >
                {option.label}
                {count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.68rem] font-semibold leading-none",
                      active ? "bg-cream/20 text-cream" : "bg-beige-light text-muted",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="moderation-search" className="sr-only">
            Search contributions by member, article or text
          </label>
          <TextInput
            id="moderation-search"
            type="search"
            value={search}
            placeholder="Search member, article or text…"
            className="rounded-full py-2.5 pl-10 pr-4 text-sm"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {actionNotice && (
        <Alert tone="success" className="mt-6">
          {actionNotice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-6" title="That didn't work">
          {actionError}
        </Alert>
      )}

      {/* Queue */}
      {isLoading ? (
        <LoadingBlock label="Loading the moderation queue…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-8"
          title="We couldn't load the queue"
          action={
            <button
              type="button"
              onClick={refresh}
              className="text-sm font-medium underline underline-offset-4"
            >
              Retry
            </button>
          }
        >
          {loadError}
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<MessageSquare className="h-5 w-5" />}
          title={
            debouncedSearch
              ? "No contributions match that search"
              : filter === "pending"
                ? "Nothing awaiting review"
                : "Nothing in this view"
          }
          description={
            debouncedSearch
              ? "Try a different search term, or clear it to see everything."
              : filter === "pending"
                ? "The queue is clear. New member contributions will appear here for review."
                : "Try a different status filter."
          }
          action={
            debouncedSearch ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-sm font-medium text-burgundy underline-offset-4 hover:underline"
              >
                Clear search
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {items.map((submission) => {
            const busy = busyId === submission.id;
            const isRejecting = rejectingId === submission.id;
            const isConfirmingDelete = confirmDeleteId === submission.id;
            const KindIcon = submission.kind === "insight" ? Lightbulb : MessageSquare;

            return (
              <li
                key={submission.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft sm:p-6"
              >
                {/* Meta */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{submission.authorName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{submission.authorEmail}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-burgundy">
                      <KindIcon className="h-3 w-3" />
                      {kindLabel(submission.kind)}
                    </span>
                    <StatusPill tone={statusTone(submission.status)}>
                      {submission.status}
                    </StatusPill>
                  </div>
                </div>

                {/* Article */}
                <p className="mt-4 text-xs text-muted">
                  On{" "}
                  <Link
                    href={`/blog/${submission.postSlug}`}
                    className="inline-flex items-center gap-1 font-medium text-burgundy underline-offset-4 hover:underline"
                  >
                    {submission.postTitle}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  {" · submitted "}
                  {formatDateTime(submission.createdAt)}
                  {submission.moderatedAt && ` · reviewed ${formatDateTime(submission.moderatedAt)}`}
                </p>

                {/* Body */}
                <blockquote className="mt-4 border-l-2 border-line pl-4">
                  <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal/85">
                    {submission.body}
                  </p>
                </blockquote>

                {submission.moderationNote && (
                  <p className="mt-4 rounded-[4px] border border-line bg-beige-light/60 p-3 text-xs leading-relaxed text-muted">
                    <span className="font-medium text-charcoal">Note to member:</span>{" "}
                    {submission.moderationNote}
                  </p>
                )}

                {/* Reject with a note */}
                {isRejecting && (
                  <div className="mt-5 rounded-[4px] border border-line bg-beige-light/50 p-4">
                    <label
                      htmlFor={`note-${submission.id}`}
                      className="text-sm font-medium text-charcoal"
                    >
                      Note to the member{" "}
                      <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <p className="mt-1 text-xs text-muted">
                      Shown on their account page. A short reason is more helpful than silence.
                    </p>
                    <TextArea
                      id={`note-${submission.id}`}
                      rows={3}
                      value={rejectNote}
                      maxLength={500}
                      disabled={busy}
                      className="mt-3"
                      placeholder="e.g. This is a strong point, but it names a third party we can't publish."
                      onChange={(event) => setRejectNote(event.target.value)}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void applyStatus(submission, "rejected", rejectNote)}
                      >
                        {busy ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner />
                            Declining…
                          </span>
                        ) : (
                          "Confirm decline"
                        )}
                      </Button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setRejectingId(null);
                          setRejectNote("");
                        }}
                        className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {isConfirmingDelete && (
                  <Alert tone="error" className="mt-5" title="Delete this contribution?">
                    <p>
                      This removes it permanently. If you just don&rsquo;t want it published,
                      decline it instead — the member then sees why.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(submission)}
                        className="inline-flex items-center gap-2 rounded-[3px] bg-danger px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {busy ? <Spinner /> : <Trash className="h-3.5 w-3.5" />}
                        {busy ? "Deleting…" : "Delete permanently"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-sm font-medium underline underline-offset-4 disabled:opacity-60"
                      >
                        Keep it
                      </button>
                    </div>
                  </Alert>
                )}

                {/* Actions */}
                {!isRejecting && !isConfirmingDelete && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                    {submission.status !== "approved" && (
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void applyStatus(submission, "approved")}
                      >
                        {busy ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner />
                            Approving…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Approve &amp; publish
                          </span>
                        )}
                      </Button>
                    )}

                    {submission.status !== "rejected" && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setRejectingId(submission.id);
                          setRejectNote(submission.moderationNote ?? "");
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Close className="h-4 w-4" />
                          Decline
                        </span>
                      </Button>
                    )}

                    {submission.status !== "pending" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void applyStatus(submission, "pending")}
                        className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                      >
                        Return to queue
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(submission.id)}
                      className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline disabled:opacity-60"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && !loadError && (
        <nav
          aria-label="Moderation queue pages"
          className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex items-center gap-2 text-sm font-medium text-burgundy disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Previous
          </button>
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="inline-flex items-center gap-2 text-sm font-medium text-burgundy disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
