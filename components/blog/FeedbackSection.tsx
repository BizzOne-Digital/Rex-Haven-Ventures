"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Spinner, LoadingBlock } from "@/components/ui/Spinner";
import { Field, TextArea } from "@/components/ui/Field";
import { Check, Lightbulb, MessageSquare } from "@/components/ui/Icons";
import { useSession } from "@/components/auth/SessionProvider";
import { fetchApprovedFeedback, submitFeedback } from "@/services/feedback";
import { isAbort } from "@/services/api-client";
import type { PublicFeedback } from "@/lib/feedback-types";
import { feedbackKinds, type FeedbackKindValue } from "@/lib/blog-schema";
import {
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
  emptyFeedbackValues,
  hasFeedbackErrors,
  validateFeedback,
  type FeedbackFieldErrors,
  type FeedbackValues,
} from "@/lib/feedback-validation";

/**
 * Reader discussion for a blog article.
 *
 * Two halves: the approved contributions from other members, and — for signed-in
 * members — a form to add one. Submissions enter moderation, so the form is
 * explicit that nothing appears immediately; promising otherwise would make the
 * review step feel like a bug.
 *
 * Content is rendered as plain text nodes (React escapes it) and is stripped of
 * markup server-side before storage.
 */

const kindMeta: Record<FeedbackKindValue, { label: string; blurb: string; icon: typeof MessageSquare }> = {
  feedback: {
    label: "Feedback",
    blurb: "React to the argument — where it lands, and where you would push back.",
    icon: MessageSquare,
  },
  insight: {
    label: "An insight",
    blurb: "Add something from your own experience that extends the discussion.",
    icon: Lightbulb,
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type SubmitStatus = "idle" | "submitting" | "submitted" | "error";

export function FeedbackSection({
  postSlug,
  postTitle,
}: {
  postSlug: string;
  postTitle: string;
}) {
  const { user, isLoading: sessionLoading } = useSession();
  const pathname = usePathname();

  const [items, setItems] = useState<PublicFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [values, setValues] = useState<FeedbackValues>(emptyFeedbackValues);
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [formMessage, setFormMessage] = useState("");

  const submitting = status === "submitting";
  const remaining = FEEDBACK_MAX_LENGTH - values.body.length;

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchApprovedFeedback>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setItems(result.data.items);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(async () => {
    apply(await fetchApprovedFeedback(postSlug));
  }, [apply, postSlug]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchApprovedFeedback(postSlug, controller.signal).then(apply);
    return () => controller.abort();
  }, [apply, postSlug]);

  function update<K extends keyof FeedbackValues>(name: K, value: FeedbackValues[K]) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted) setErrors(validateFeedback(next));
    if (status === "error") {
      setStatus("idle");
      setFormMessage("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateFeedback(values);
    setErrors(found);
    setSubmitted(true);

    if (hasFeedbackErrors(found)) {
      document.getElementById("feedback-body")?.focus();
      return;
    }

    setStatus("submitting");
    setFormMessage("");

    const result = await submitFeedback(postSlug, values);

    if (!result.ok) {
      setStatus("error");
      setFormMessage(result.error.message);
      if (result.error.fieldErrors) {
        setErrors((current) => ({ ...current, ...result.error.fieldErrors }));
      }
      return;
    }

    setStatus("submitted");
    setValues(emptyFeedbackValues);
    setSubmitted(false);
    setErrors({});
  }

  function writeAnother() {
    setStatus("idle");
    setFormMessage("");
  }

  return (
    <section
      id="discussion"
      className="border-t border-line bg-cream py-20 md:py-28"
      aria-labelledby="discussion-heading"
    >
      <Container size="narrow">
        <Reveal>
          <Eyebrow>Member Discussion</Eyebrow>
          <h2 id="discussion-heading" className="mt-5 font-serif text-3xl text-ink md:text-4xl">
            Feedback &amp; insights
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Perspectives from members on this article. Contributions are reviewed by our team
            before they appear, so the discussion stays considered.
          </p>
        </Reveal>

        {/* ---- Approved contributions ---- */}
        <div className="mt-12">
          {isLoading ? (
            <LoadingBlock label="Loading contributions…" />
          ) : loadError ? (
            <Alert
              tone="error"
              title="We couldn't load the discussion"
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
          ) : items.length === 0 ? (
            <div className="rounded-[6px] border border-line bg-beige-light/60 px-6 py-12 text-center">
              <p className="font-serif text-xl text-ink">No contributions yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Be the first member to share a perspective on this piece.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-6">
              {items.map((item, index) => {
                const meta = kindMeta[item.kind as FeedbackKindValue] ?? kindMeta.feedback;
                const IconCmp = meta.icon;
                return (
                  <Reveal key={item.id} as="li" delay={(index % 3) * 70}>
                    <article className="rounded-[6px] border border-line bg-cream p-6 shadow-soft">
                      <div className="flex items-start gap-4">
                        <span
                          aria-hidden
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-burgundy-tint text-xs font-semibold text-burgundy-deep"
                        >
                          {initials(item.authorName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-sm font-medium text-ink">{item.authorName}</p>
                            <span aria-hidden className="text-line-dark">
                              &middot;
                            </span>
                            <time dateTime={item.createdAt} className="text-xs text-muted">
                              {formatDate(item.createdAt)}
                            </time>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-burgundy">
                              <IconCmp className="h-3 w-3" />
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal/85">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </div>

        {/* ---- Contribute ---- */}
        <div className="mt-14 border-t border-line pt-12">
          {sessionLoading ? (
            <LoadingBlock label="Checking your sign-in status…" />
          ) : !user ? (
            <div className="rounded-[6px] border border-line bg-beige-light/60 p-6 sm:p-8">
              <h3 className="font-serif text-xl text-ink">Share your perspective</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                Member accounts let you offer feedback on this article and share insights of
                your own. It takes a moment to set up.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button href={`/login?next=${encodeURIComponent(pathname)}`} withArrow>
                  Sign in
                </Button>
                <Button href={`/signup?next=${encodeURIComponent(pathname)}`} variant="outline">
                  Create an account
                </Button>
              </div>
            </div>
          ) : status === "submitted" ? (
            <div className="rounded-[6px] border border-line bg-cream p-6 shadow-soft sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
                <Check className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-serif text-2xl text-ink">Thank you — it&rsquo;s with us.</h3>
              <p className="mt-3 max-w-md leading-relaxed text-muted">
                Your contribution is awaiting review. Once approved it will appear on this page
                alongside the other perspectives. You can follow its status from your account.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-5">
                <Link
                  href="/account"
                  className="text-sm font-medium text-burgundy underline-offset-4 hover:underline"
                >
                  View my contributions
                </Link>
                <button
                  type="button"
                  onClick={writeAnother}
                  className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline"
                >
                  Write another
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-[6px] border border-line bg-cream p-6 shadow-soft sm:p-8"
            >
              <h3 className="font-serif text-xl text-ink">Share your perspective</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                Responding to <span className="text-charcoal">{postTitle}</span> as{" "}
                <span className="text-charcoal">{user.name}</span>. Your name is shown with
                approved contributions; your email address is never published.
              </p>

              {status === "error" && formMessage && (
                <Alert tone="error" className="mt-6" title="We couldn't submit that">
                  {formMessage}
                </Alert>
              )}

              {/* Kind selector */}
              <fieldset className="mt-6">
                <legend className="mb-2 text-sm font-medium text-charcoal">
                  What would you like to share?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {feedbackKinds.map((kind) => {
                    const meta = kindMeta[kind];
                    const IconCmp = meta.icon;
                    const active = values.kind === kind;
                    return (
                      <label
                        key={kind}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[4px] border p-4 transition-colors duration-300",
                          active
                            ? "border-burgundy bg-burgundy-tint/40"
                            : "border-line hover:border-burgundy/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="kind"
                          value={kind}
                          checked={active}
                          disabled={submitting}
                          onChange={() => update("kind", kind)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy"
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-sm font-medium text-ink">
                            <IconCmp className="h-4 w-4 text-burgundy" />
                            {meta.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted">
                            {meta.blurb}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.kind && (
                  <p role="alert" className="mt-1.5 text-sm text-danger">
                    {errors.kind}
                  </p>
                )}
              </fieldset>

              <Field
                id="feedback-body"
                label="Your contribution"
                className="mt-6"
                error={submitted ? errors.body : undefined}
                hint={
                  <span className={cn(remaining < 100 && "text-burgundy")}>
                    {remaining} characters left
                  </span>
                }
                description={`At least ${FEEDBACK_MIN_LENGTH} characters. Written as plain text — no formatting needed.`}
              >
                <TextArea
                  id="feedback-body"
                  name="body"
                  rows={7}
                  value={values.body}
                  maxLength={FEEDBACK_MAX_LENGTH}
                  disabled={submitting}
                  placeholder="What did this piece get right, or miss? What does your own experience add?"
                  hasError={Boolean(submitted && errors.body)}
                  aria-invalid={Boolean(submitted && errors.body) || undefined}
                  aria-describedby={
                    submitted && errors.body ? "feedback-body-error" : "feedback-body-description"
                  }
                  onChange={(event) => update("body", event.target.value)}
                />
              </Field>

              <Alert tone="info" className="mt-6">
                Contributions are reviewed before publication. Nothing appears on this page
                immediately.
              </Alert>

              <div className="mt-6">
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2.5">
                      <Spinner />
                      Submitting…
                    </span>
                  ) : (
                    "Submit for review"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
