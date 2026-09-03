"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { Field, TextArea } from "@/components/ui/Field";
import { MessageSquare, Pencil, Trash } from "@/components/ui/Icons";
import { isAbort } from "@/services/api-client";
import {
  fetchMySubmissions,
  updateMySubmission,
  withdrawMySubmission,
} from "@/services/feedback";
import type { FeedbackCounts, MySubmission } from "@/lib/feedback-types";
import {
  feedbackKindLabels,
  feedbackStatusLabels,
  type FeedbackKindValue,
  type FeedbackStatusValue,
} from "@/lib/blog-schema";
import { FEEDBACK_MAX_LENGTH, validateFeedback } from "@/lib/feedback-validation";

/**
 * A member's own contributions, with their moderation status.
 *
 * Pending items stay editable and withdrawable; approved and rejected ones are
 * read-only, because editing either would sidestep the review that has already
 * happened. The server enforces the same rule.
 */

type Filter = "all" | FeedbackStatusValue;

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Awaiting review" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "Not published" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function kindLabel(kind: string): string {
  return feedbackKindLabels[kind as FeedbackKindValue] ?? "Contribution";
}

function statusLabel(status: string): string {
  return feedbackStatusLabels[status as FeedbackStatusValue] ?? status;
}

export function MySubmissions() {
  const [items, setItems] = useState<MySubmission[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | undefined>();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchMySubmissions>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setItems(result.data.items);
      setCounts(result.data.counts);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => {
    apply(await fetchMySubmissions());
  }, [apply]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMySubmissions(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  const visible = filter === "all" ? items : items.filter((item) => item.status === filter);

  function startEditing(submission: MySubmission) {
    setEditingId(submission.id);
    setDraft(submission.body);
    setDraftError(undefined);
    setActionError(null);
    setActionNotice(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft("");
    setDraftError(undefined);
  }

  async function saveEdit(submission: MySubmission) {
    const found = validateFeedback({ kind: submission.kind, body: draft });
    if (found.body) {
      setDraftError(found.body);
      return;
    }

    setSavingId(submission.id);
    setActionError(null);

    const result = await updateMySubmission(submission.id, {
      kind: submission.kind,
      body: draft,
    });

    setSavingId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      if (result.error.fieldErrors?.body) setDraftError(result.error.fieldErrors.body);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === submission.id ? result.data.submission : item)),
    );
    setActionNotice("Your contribution has been updated and is still awaiting review.");
    cancelEditing();
  }

  async function withdraw(submission: MySubmission) {
    setRemovingId(submission.id);
    setActionError(null);
    setActionNotice(null);

    const result = await withdrawMySubmission(submission.id);
    setRemovingId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== submission.id));
    setCounts((current) => ({
      ...current,
      total: Math.max(0, current.total - 1),
      pending:
        submission.status === "pending" ? Math.max(0, current.pending - 1) : current.pending,
      approved:
        submission.status === "approved" ? Math.max(0, current.approved - 1) : current.approved,
      rejected:
        submission.status === "rejected" ? Math.max(0, current.rejected - 1) : current.rejected,
    }));
    setActionNotice("Your contribution has been withdrawn.");
  }

  if (isLoading) return <LoadingBlock label="Loading your contributions…" />;

  if (loadError) {
    return (
      <Alert
        tone="error"
        title="We couldn't load your contributions"
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
        {loadError}
      </Alert>
    );
  }

  return (
    <div>
      {/* Summary */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total },
          { label: "Awaiting review", value: counts.pending },
          { label: "Published", value: counts.approved },
          { label: "Not published", value: counts.rejected },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[4px] border border-line bg-cream p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">{stat.label}</dt>
            <dd className="mt-1.5 font-serif text-2xl text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>

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

      {/* Filters */}
      {items.length > 0 && (
        <div
          className="mt-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter your contributions by status"
        >
          {filters.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
                  active
                    ? "border-burgundy bg-burgundy text-cream"
                    : "border-line text-muted hover:border-burgundy/40 hover:text-burgundy",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<MessageSquare className="h-5 w-5" />}
          title={items.length === 0 ? "You haven't contributed yet" : "Nothing in this view"}
          description={
            items.length === 0
              ? "Read one of our insights and share your perspective — approved contributions appear alongside the article."
              : "Try a different status filter to see your other contributions."
          }
          action={
            items.length === 0 ? (
              <Button href="/blog" withArrow>
                Browse insights
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-sm font-medium text-burgundy underline-offset-4 hover:underline"
              >
                Show all
              </button>
            )
          }
        />
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {visible.map((submission) => {
            const isEditing = editingId === submission.id;
            const isPending = submission.status === "pending";
            const isSaving = savingId === submission.id;
            const isRemoving = removingId === submission.id;

            return (
              <li
                key={submission.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${submission.postSlug}`}
                      className="font-serif text-lg leading-snug text-ink transition-colors hover:text-burgundy"
                    >
                      {submission.postTitle}
                    </Link>
                    <p className="mt-1.5 text-xs text-muted">
                      {kindLabel(submission.kind)} &middot; submitted{" "}
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <StatusPill tone={statusTone(submission.status)}>
                    {statusLabel(submission.status)}
                  </StatusPill>
                </div>

                {isEditing ? (
                  <div className="mt-5">
                    <Field
                      id={`edit-${submission.id}`}
                      label="Your contribution"
                      error={draftError}
                      hint={`${draft.trim().length} / ${FEEDBACK_MAX_LENGTH}`}
                    >
                      <TextArea
                        id={`edit-${submission.id}`}
                        rows={6}
                        value={draft}
                        maxLength={FEEDBACK_MAX_LENGTH}
                        disabled={isSaving}
                        hasError={Boolean(draftError)}
                        aria-describedby={
                          draftError ? `edit-${submission.id}-error` : undefined
                        }
                        onChange={(event) => {
                          setDraft(event.target.value);
                          if (draftError) setDraftError(undefined);
                        }}
                      />
                    </Field>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        type="button"
                        onClick={() => void saveEdit(submission)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <span className="inline-flex items-center gap-2">
                            <Spinner />
                            Saving…
                          </span>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal/85">
                    {submission.body}
                  </p>
                )}

                {submission.moderationNote && !isEditing && (
                  <Alert tone="info" className="mt-4" title="Note from our team">
                    {submission.moderationNote}
                  </Alert>
                )}

                {isPending && !isEditing && (
                  <>
                    <p className="mt-4 text-xs leading-relaxed text-muted">
                      This is awaiting review. It will appear alongside the article once
                      approved — you can still edit or withdraw it until then.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => startEditing(submission)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void withdraw(submission)}
                        disabled={isRemoving}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline disabled:opacity-60"
                      >
                        {isRemoving ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                        {isRemoving ? "Withdrawing…" : "Withdraw"}
                      </button>
                    </div>
                  </>
                )}

                {submission.status === "approved" && (
                  <p className="mt-4 text-xs text-muted">
                    Published — this appears alongside the article for everyone reading it.
                  </p>
                )}

                {submission.status === "rejected" && !submission.moderationNote && (
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    This one wasn&rsquo;t published. You&rsquo;re very welcome to share a
                    different perspective on this or any other article.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
