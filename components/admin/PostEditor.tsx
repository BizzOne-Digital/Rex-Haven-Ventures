"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ArrowRight, Upload } from "@/components/ui/Icons";
import { createPost, updatePost } from "@/services/admin";
import { uploadMedia } from "@/services/media";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { AdminPost } from "@/lib/post-types";
import { articleCovers } from "@/lib/blog-schema";
import {
  BODY_MIN,
  EXCERPT_MAX,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  TAGS_MAX,
  TITLE_MAX,
  emptyPostValues,
  estimateReadingMinutes,
  hasPostErrors,
  serializeTags,
  validatePost,
  type PostFieldErrors,
  type PostValues,
} from "@/lib/post-validation";
import { slugify } from "@/lib/sanitize";

/**
 * Blog post editor.
 *
 * The body is authored as plain text with a tiny, memorable set of conventions
 * (`## heading`, `> quote`, `- list`), parsed server-side into the same
 * `ContentBlock[]` structure the built-in articles use. That keeps the public
 * article renderer completely unchanged — and means no rich-text editor to
 * learn, or to sanitise.
 */

const fieldOrder: (keyof PostValues)[] = [
  "title",
  "slug",
  "excerpt",
  "category",
  "date",
  "readingMinutes",
  "author",
  "cover",
  "coverImage",
  "tags",
  "body",
  "seoTitle",
  "seoDescription",
];

const coverLabels: Record<string, string> = {
  arch: "Arch — deep burgundy",
  grid: "Grid — structured",
  ridge: "Ridge — warm burgundy",
  orbit: "Orbit — dark burgundy",
  column: "Column — editorial",
  wave: "Wave — flowing",
  spark: "Spark — accent",
};

type Status = "idle" | "saving" | "error";

/** Turns a loaded post plus its serialized body into editor values. */
function toValues(post: AdminPost, body: string): PostValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    date: post.date,
    readingMinutes: String(post.readingMinutes),
    author: post.author,
    cover: post.cover,
    coverImage: post.coverImage,
    tags: serializeTags(post.tags ?? []),
    featured: post.featured,
    status: post.status,
    body,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  };
}

export function PostEditor({
  post,
  initialBody = "",
  categories,
}: {
  /** Omit to create a new post. */
  post?: AdminPost;
  initialBody?: string;
  /** Live category names, resolved on the server. */
  categories: string[];
}) {
  const router = useRouter();
  const isEditing = Boolean(post);

  const [values, setValues] = useState<PostValues>(() =>
    post
      ? toValues(post, initialBody)
      : { ...emptyPostValues, category: categories[0] ?? emptyPostValues.category },
  );
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  // Featured-image upload, done from inside the editor so publishing a post
  // with a new image is one flow rather than a detour through Media.
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<PostFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formMessage, setFormMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  // Auto-fill the slug from the title only until the operator edits it.
  const [slugLocked, setSlugLocked] = useState(isEditing);

  const saving = status === "saving";

  // Warn before losing unsaved edits.
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const showError = (name: keyof PostValues) =>
    submitted && errors[name] ? errors[name] : undefined;

  function update<K extends keyof PostValues>(name: K, value: PostValues[K]) {
    setValues((current) => {
      const next = { ...current, [name]: value };

      // Keep the slug in step with the title while it is still unlocked.
      if (name === "title" && !slugLocked) {
        next.slug = slugify(String(value));
      }

      if (submitted) setErrors(validatePost(next));
      return next;
    });

    setIsDirty(true);
    if (status === "error") {
      setStatus("idle");
      setFormMessage("");
    }
  }

  function applyEstimatedReadingTime() {
    update("readingMinutes", String(estimateReadingMinutes(values.body)));
  }

  /**
   * Uploads a chosen file and attaches it as this post's featured image.
   *
   * The upload goes through the same `/api/admin/media` endpoint the library
   * uses, so the image is stored on whichever back end is configured and is
   * indexed in Media like any other — it just doesn't require visiting that
   * screen first. `coverImage` holds the returned URL, which is what actually
   * ties the image to the post when it saves.
   */
  async function handleCoverUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setCoverUploadError(null);

    const result = await uploadMedia(file);

    setUploadingCover(false);
    // Clear the input so re-picking the same file fires `change` again.
    if (coverFileRef.current) coverFileRef.current.value = "";

    if (!result.ok) {
      setCoverUploadError(result.error.message);
      return;
    }

    update("coverImage", result.data.media.url);
    setShowMediaPicker(false);
  }

  async function save(nextStatus?: "draft" | "published") {
    const candidate = nextStatus ? { ...values, status: nextStatus } : values;
    const found = validatePost(candidate);
    setErrors(found);
    setSubmitted(true);
    setNotice(null);

    if (hasPostErrors(found)) {
      setStatus("error");
      setFormMessage("Please review the highlighted fields.");
      const first = fieldOrder.find((field) => found[field]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("saving");
    setFormMessage("");
    setValues(candidate);

    const result = isEditing && post
      ? await updatePost(post.id, candidate)
      : await createPost(candidate);

    if (!result.ok) {
      setStatus("error");
      setFormMessage(result.error.message);
      if (result.error.fieldErrors) {
        setErrors((current) => ({ ...current, ...result.error.fieldErrors }));
        const firstServerField = fieldOrder.find((field) => result.error.fieldErrors?.[field]);
        if (firstServerField) document.getElementById(firstServerField)?.focus();
      }
      return;
    }

    setStatus("idle");
    setIsDirty(false);

    if (isEditing) {
      setNotice(
        candidate.status === "published"
          ? "Saved and live on the blog."
          : "Saved as a draft — not visible on the public blog.",
      );
      router.refresh();
      return;
    }

    // A new post: hand over to its own edit page so further saves update it.
    router.replace(`/admin/blog/${result.data.post.id}`);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/blog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy"
          >
            <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            All posts
          </Link>
          <h2 className="mt-4 font-serif text-2xl text-ink">
            {isEditing ? "Edit post" : "New post"}
          </h2>
          {isEditing && post && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <code className="font-mono text-[0.9em]">/blog/{post.slug}</code>
              <span aria-hidden>&middot;</span>
              <Link
                href={`/admin/blog/${post.id}/preview`}
                className="text-burgundy underline-offset-4 hover:underline"
              >
                Preview
              </Link>
              {post.status === "published" && (
                <>
                  <span aria-hidden>&middot;</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-burgundy underline-offset-4 hover:underline"
                  >
                    View on site
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {notice && (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {status === "error" && formMessage && (
        <Alert tone="error" className="mt-6" title="We couldn't save this post">
          {formMessage}
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        noValidate
        className="mt-8 flex flex-col gap-10"
      >
        {/* ---- Content ---- */}
        <fieldset className="rounded-[6px] border border-line bg-cream p-6 shadow-soft">
          <legend className="px-2 font-serif text-lg text-ink">Content</legend>

          <div className="mt-4 flex flex-col gap-5">
            <Field
              id="title"
              label="Title"
              error={showError("title")}
              hint={`${values.title.length} / ${TITLE_MAX}`}
            >
              <TextInput
                id="title"
                value={values.title}
                maxLength={TITLE_MAX}
                disabled={saving}
                placeholder="Beyond the Opportunity: What We Look for Before We Look at Returns"
                hasError={Boolean(showError("title"))}
                aria-describedby={showError("title") ? "title-error" : undefined}
                onChange={(event) => update("title", event.target.value)}
              />
            </Field>

            <Field
              id="slug"
              label="URL slug"
              error={showError("slug")}
              description={`The public address will be /blog/${values.slug || "your-slug"}`}
            >
              <TextInput
                id="slug"
                value={values.slug}
                disabled={saving}
                placeholder="beyond-the-opportunity"
                hasError={Boolean(showError("slug"))}
                aria-describedby={showError("slug") ? "slug-error" : "slug-description"}
                onChange={(event) => {
                  setSlugLocked(true);
                  update("slug", event.target.value);
                }}
                onBlur={(event) => update("slug", slugify(event.target.value))}
              />
            </Field>

            <Field
              id="excerpt"
              label="Excerpt"
              error={showError("excerpt")}
              hint={`${values.excerpt.length} / ${EXCERPT_MAX}`}
              description="Shown on the blog index and article cards, and used as the meta description when no SEO description is set."
            >
              <TextArea
                id="excerpt"
                rows={3}
                value={values.excerpt}
                maxLength={EXCERPT_MAX}
                disabled={saving}
                hasError={Boolean(showError("excerpt"))}
                aria-describedby={showError("excerpt") ? "excerpt-error" : "excerpt-description"}
                onChange={(event) => update("excerpt", event.target.value)}
              />
            </Field>

            <Field
              id="body"
              label="Body"
              error={showError("body")}
              hint={`${values.body.trim().length} characters`}
              description={
                <>
                  Plain text — each new line starts a new paragraph. At the start of a line:{" "}
                  <code className="font-mono">## </code> heading,{" "}
                  <code className="font-mono">### </code> subheading,{" "}
                  <code className="font-mono">&gt; </code> pull quote,{" "}
                  <code className="font-mono">- </code> or <code className="font-mono">1. </code>{" "}
                  list item. Inside a line:{" "}
                  <code className="font-mono">**bold**</code>,{" "}
                  <code className="font-mono">*italic*</code>,{" "}
                  <code className="font-mono">[link text](https://…)</code>. At least {BODY_MIN}{" "}
                  characters.
                </>
              }
            >
              <TextArea
                id="body"
                rows={18}
                value={values.body}
                disabled={saving}
                placeholder={
                  "Every opportunity arrives dressed in its **best numbers**.\n\n## Three questions before the model\n\nWe tend to sit with three questions.\n\n### Before the valuation\n\n- What is genuinely defensible in three years?\n- Do the people involved have the resilience to adapt?\n\n> We look beyond the opportunity.\n\nRead more in our [approach](/services)."
                }
                hasError={Boolean(showError("body"))}
                aria-describedby={showError("body") ? "body-error" : "body-description"}
                className="font-mono text-[0.9rem] leading-relaxed"
                onChange={(event) => update("body", event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---- Presentation ---- */}
        <fieldset className="rounded-[6px] border border-line bg-cream p-6 shadow-soft">
          <legend className="px-2 font-serif text-lg text-ink">Presentation</legend>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field
              id="category"
              label="Category"
              error={showError("category")}
              hint={
                <Link
                  href="/admin/categories"
                  className="text-burgundy underline-offset-4 hover:underline"
                >
                  Manage
                </Link>
              }
              description={
                categories.length === 0
                  ? "No categories exist yet — create one on the Categories screen."
                  : undefined
              }
            >
              <Select
                id="category"
                value={values.category}
                disabled={saving}
                hasError={Boolean(showError("category"))}
                onChange={(event) => update("category", event.target.value)}
              >
                {/* A post can carry a category that has since been renamed or
                    removed. Keep it selectable so saving does not silently
                    reassign it without the operator noticing. */}
                {!categories.includes(values.category) && values.category && (
                  <option value={values.category}>{values.category} (no longer listed)</option>
                )}
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="author" label="Author byline" error={showError("author")}>
              <TextInput
                id="author"
                value={values.author}
                disabled={saving}
                placeholder="Rex Haven Ventures"
                hasError={Boolean(showError("author"))}
                onChange={(event) => update("author", event.target.value)}
              />
            </Field>

            <Field id="date" label="Publication date" error={showError("date")}>
              <TextInput
                id="date"
                type="date"
                value={values.date}
                disabled={saving}
                hasError={Boolean(showError("date"))}
                onChange={(event) => update("date", event.target.value)}
              />
            </Field>

            <Field
              id="readingMinutes"
              label="Reading time (minutes)"
              error={showError("readingMinutes")}
              hint={
                <button
                  type="button"
                  onClick={applyEstimatedReadingTime}
                  className="text-burgundy underline-offset-4 hover:underline"
                >
                  Estimate from body
                </button>
              }
            >
              <TextInput
                id="readingMinutes"
                type="number"
                min={1}
                max={120}
                value={values.readingMinutes}
                disabled={saving}
                hasError={Boolean(showError("readingMinutes"))}
                onChange={(event) => update("readingMinutes", event.target.value)}
              />
            </Field>

            <Field
              id="cover"
              label="Cover style"
              error={showError("cover")}
              description="Abstract on-brand artwork, used when no cover image URL is set."
            >
              <Select
                id="cover"
                value={values.cover}
                disabled={saving}
                hasError={Boolean(showError("cover"))}
                onChange={(event) => update("cover", event.target.value)}
              >
                {articleCovers.map((cover) => (
                  <option key={cover} value={cover}>
                    {coverLabels[cover] ?? cover}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="coverImage"
              label="Featured image"
              optional
              error={showError("coverImage")}
              hint={
                <span className="inline-flex items-center gap-3">
                  {/* Upload first: attaching a new image is the common case,
                      picking an already-uploaded one the exception. */}
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={saving || uploadingCover}
                    className="inline-flex items-center gap-1.5 font-medium text-burgundy underline-offset-4 hover:underline disabled:opacity-60"
                  >
                    {uploadingCover ? (
                      <Spinner className="h-3.5 w-3.5" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploadingCover ? "Uploading…" : "Upload image"}
                  </button>
                  <span aria-hidden className="text-line">
                    |
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker((open) => !open)}
                    className="text-burgundy underline-offset-4 hover:underline"
                  >
                    {showMediaPicker ? "Close library" : "Choose from library"}
                  </button>
                </span>
              }
              description="Upload an image and it is attached to this post on save. You can also pick one already in the library, or paste a full https:// URL — remote hosts must be allowed in next.config.ts."
            >
              <TextInput
                id="coverImage"
                type="text"
                value={values.coverImage}
                disabled={saving}
                placeholder="/uploads/my-image.jpg or https://example.com/photo.jpg"
                hasError={Boolean(showError("coverImage"))}
                aria-describedby={
                  showError("coverImage") ? "coverImage-error" : "coverImage-description"
                }
                onChange={(event) => update("coverImage", event.target.value)}
              />
              {/* Driven by the "Upload image" button above, so the field keeps
                  its normal text-input appearance. */}
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleCoverUpload(event.target.files)}
              />
              {coverUploadError && (
                <p className="mt-2 text-xs text-danger">{coverUploadError}</p>
              )}
            </Field>

            <Field
              id="tags"
              label="Tags"
              optional
              error={showError("tags")}
              description={`Comma-separated, up to ${TAGS_MAX}. Lowercased and de-duplicated on save.`}
              className="sm:col-span-2"
            >
              <TextInput
                id="tags"
                value={values.tags}
                disabled={saving}
                placeholder="venture debt, small business, capital"
                hasError={Boolean(showError("tags"))}
                aria-describedby={showError("tags") ? "tags-error" : "tags-description"}
                onChange={(event) => update("tags", event.target.value)}
              />
            </Field>
          </div>

          {/* Current featured image + library picker */}
          {values.coverImage && (
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[4px] border border-line bg-beige-light/40 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
                  remote URLs are allowed here and may not be in next.config.ts;
                  a plain img avoids the optimizer rejecting them outright. */}
              <img
                src={values.coverImage}
                alt=""
                className="h-16 w-24 shrink-0 rounded-[3px] border border-line object-cover"
              />
              <p className="min-w-0 flex-1 truncate text-xs text-muted">
                {values.coverImage}
              </p>
              <button
                type="button"
                onClick={() => update("coverImage", "")}
                className="text-xs font-medium text-muted underline-offset-4 hover:text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {showMediaPicker && (
            <div className="mt-6 rounded-[4px] border border-line bg-beige-light/30 p-4">
              <MediaLibrary
                compact
                selectedUrl={values.coverImage}
                onSelect={(item) => {
                  update("coverImage", item.url);
                  setShowMediaPicker(false);
                }}
              />
            </div>
          )}

          <div className="mt-6 border-t border-line pt-6">
            <Checkbox
              id="featured"
              label="Feature this post at the top of the blog"
              description="Only one post can be featured. Selecting this clears the flag on any other post."
              checked={values.featured}
              disabled={saving}
              onChange={(checked) => update("featured", checked)}
            />
          </div>
        </fieldset>

        {/* ---- SEO ---- */}
        <fieldset className="rounded-[6px] border border-line bg-cream p-6 shadow-soft">
          <legend className="px-2 font-serif text-lg text-ink">Search metadata</legend>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Optional. Leave blank to use the title and excerpt, which is usually the right
            choice.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            <Field
              id="seoTitle"
              label="SEO title"
              optional
              error={showError("seoTitle")}
              hint={`${values.seoTitle.length} / ${SEO_TITLE_MAX}`}
            >
              <TextInput
                id="seoTitle"
                value={values.seoTitle}
                maxLength={SEO_TITLE_MAX}
                disabled={saving}
                placeholder={values.title || "Defaults to the post title"}
                hasError={Boolean(showError("seoTitle"))}
                onChange={(event) => update("seoTitle", event.target.value)}
              />
            </Field>

            <Field
              id="seoDescription"
              label="SEO description"
              optional
              error={showError("seoDescription")}
              hint={`${values.seoDescription.length} / ${SEO_DESCRIPTION_MAX}`}
            >
              <TextArea
                id="seoDescription"
                rows={3}
                value={values.seoDescription}
                maxLength={SEO_DESCRIPTION_MAX}
                disabled={saving}
                placeholder="Defaults to the excerpt"
                hasError={Boolean(showError("seoDescription"))}
                onChange={(event) => update("seoDescription", event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---- Save ---- */}
        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-cream/95 px-1 py-5 backdrop-blur-sm supports-[backdrop-filter]:bg-cream/85">
          <Button type="button" size="lg" disabled={saving} onClick={() => void save("published")}>
            {saving ? (
              <span className="inline-flex items-center gap-2.5">
                <Spinner />
                Saving…
              </span>
            ) : values.status === "published" ? (
              "Save & keep live"
            ) : (
              "Publish"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={saving}
            onClick={() => void save("draft")}
          >
            {values.status === "published" ? "Unpublish & save draft" : "Save draft"}
          </Button>

          {isEditing && post && (
            <Button href={`/admin/blog/${post.id}/preview`} variant="outline" size="lg">
              Preview
            </Button>
          )}

          <p className="ml-auto text-xs text-muted">
            {values.status === "published"
              ? "This post is live on the public blog."
              : "Drafts are visible only in this dashboard."}
          </p>
        </div>
      </form>
    </div>
  );
}
