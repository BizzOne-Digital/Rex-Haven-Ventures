"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { Select, TextInput } from "@/components/ui/Field";
import { Download, Eye, FileText, Pencil, Plus, Search, Trash } from "@/components/ui/Icons";
import {
  deletePost,
  fetchPosts,
  importBuiltInPosts,
  setPostStatus,
} from "@/services/admin";
import { isAbort } from "@/services/api-client";
import type { AdminPost, PostCounts } from "@/lib/post-types";
import { formatArticleDate } from "@/lib/articles";

/**
 * Blog post management.
 *
 * Extends the existing blog rather than replacing it: posts imported from
 * `lib/articles.ts` are ordinary rows here, editable like any other. Until the
 * import runs, the public blog keeps serving the built-in file, which is why the
 * empty state offers the import rather than just "create your first post".
 */

type Filter = "all" | "published" | "draft";

const filters: { value: Filter; label: string; countKey: keyof PostCounts }[] = [
  { value: "all", label: "All", countKey: "total" },
  { value: "published", label: "Published", countKey: "published" },
  { value: "draft", label: "Drafts", countKey: "drafts" },
];

export function PostManager({ categories }: { categories: string[] }) {
  const [items, setItems] = useState<AdminPost[]>([]);
  const [counts, setCounts] = useState<PostCounts>({ total: 0, published: 0, drafts: 0 });
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchPosts>>) => {
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

  const load = useCallback(
    async (query: { status?: string; q?: string }) => {
      apply(await fetchPosts(query));
    },
    [apply],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchPosts({ status: filter, q: debouncedSearch }, controller.signal).then(apply);
    return () => controller.abort();
  }, [apply, filter, debouncedSearch]);

  function reload() {
    void load({ status: filter, q: debouncedSearch });
  }

  async function togglePublished(post: AdminPost) {
    const next = post.status === "published" ? "draft" : "published";
    setBusyId(post.id);
    setActionError(null);
    setActionNotice(null);

    const result = await setPostStatus(post.id, next);
    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setActionNotice(
      next === "published"
        ? `“${post.title}” is now live on the blog.`
        : `“${post.title}” has been taken offline and is back to a draft.`,
    );
    reload();
  }

  async function remove(post: AdminPost) {
    setBusyId(post.id);
    setActionError(null);
    setActionNotice(null);

    const result = await deletePost(post.id);
    setBusyId(null);
    setConfirmDeleteId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setActionNotice(`“${post.title}” was deleted.`);
    reload();
  }

  async function handleImport() {
    setImporting(true);
    setActionError(null);
    setActionNotice(null);

    const result = await importBuiltInPosts();
    setImporting(false);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    const { imported, skipped } = result.data;
    setActionNotice(
      imported === 0
        ? `Nothing to import — all ${skipped} built-in articles are already here.`
        : `Imported ${imported} article${imported === 1 ? "" : "s"}${
            skipped > 0 ? `, skipped ${skipped} already present` : ""
          }.`,
    );
    reload();
  }

  // Status and text filtering happen server-side; category and ordering are
  // applied here because the full list is already in memory.
  const visible = items
    .filter((post) => categoryFilter === "all" || post.category === categoryFilter)
    .slice()
    .sort((a, b) => (sort === "newest" ? (a.date < b.date ? 1 : -1) : a.date > b.date ? 1 : -1));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Blog posts</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Published posts appear on the public blog immediately. Drafts are visible only here.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/admin/blog/new">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New post
            </span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-7 flex flex-col gap-4 border-b border-line pb-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by status">
          {filters.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
                  active
                    ? "border-burgundy bg-burgundy text-cream"
                    : "border-line text-muted hover:border-burgundy/40 hover:text-burgundy",
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.68rem] font-semibold leading-none",
                    active ? "bg-cream/20 text-cream" : "bg-beige-light text-muted",
                  )}
                >
                  {counts[option.countKey]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
          <div>
            <label htmlFor="post-category" className="sr-only">
              Filter by category
            </label>
            <Select
              id="post-category"
              value={categoryFilter}
              className="py-2.5 text-sm"
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="post-sort" className="sr-only">
              Sort by date
            </label>
            <Select
              id="post-sort"
              value={sort}
              className="py-2.5 text-sm"
              onChange={(event) => setSort(event.target.value as "newest" | "oldest")}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </Select>
          </div>

          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <label htmlFor="post-search" className="sr-only">
              Search posts by title, slug or excerpt
            </label>
            <TextInput
              id="post-search"
              type="search"
              value={search}
              placeholder="Search title, slug or excerpt…"
              className="rounded-full py-2.5 pl-10 pr-4 text-sm"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
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

      {isLoading ? (
        <LoadingBlock label="Loading posts…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-8"
          title="We couldn't load the posts"
          action={
            <button
              type="button"
              onClick={reload}
              className="text-sm font-medium underline underline-offset-4"
            >
              Retry
            </button>
          }
        >
          {loadError}
        </Alert>
      ) : visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FileText className="h-5 w-5" />}
          title={
            categoryFilter !== "all" && items.length > 0
              ? `No posts in “${categoryFilter}”`
              : debouncedSearch
              ? "No posts match that search"
              : counts.total === 0
                ? "The blog isn't in the database yet"
                : "Nothing in this view"
          }
          description={
            debouncedSearch
              ? "Try a different term, or clear the search."
              : counts.total === 0
                ? "The public blog is currently serving the built-in articles from lib/articles.ts. Import them to manage them here — existing slugs are never overwritten, so it's safe to run twice."
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
            ) : counts.total === 0 ? (
              <div className="flex flex-wrap justify-center gap-3">
                <Button type="button" onClick={() => void handleImport()} disabled={importing}>
                  {importing ? (
                    <span className="inline-flex items-center gap-2.5">
                      <Spinner />
                      Importing…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Import built-in articles
                    </span>
                  )}
                </Button>
                <Button href="/admin/blog/new" variant="outline">
                  Write a new post
                </Button>
              </div>
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
          {visible.map((post) => {
            const busy = busyId === post.id;
            const isPublished = post.status === "published";
            const isConfirmingDelete = confirmDeleteId === post.id;

            return (
              <li
                key={post.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={statusTone(post.status)}>
                        {isPublished ? "Published" : "Draft"}
                      </StatusPill>
                      {post.featured && <StatusPill tone="brand">Featured</StatusPill>}
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-burgundy">
                        {post.category}
                      </span>
                    </div>

                    <h3 className="mt-3 font-serif text-xl leading-snug text-ink">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      <code className="font-mono">/blog/{post.slug}</code>
                      {" · "}
                      {formatArticleDate(post.date)}
                      {" · "}
                      {post.readingMinutes} min read
                      {" · by "}
                      {post.author}
                    </p>

                    {post.tags.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-line px-2 py-0.5 text-[0.68rem] text-muted"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {isConfirmingDelete ? (
                  <Alert tone="error" className="mt-5" title="Delete this post?">
                    <p>
                      This permanently removes “{post.title}” from the blog. To take it offline
                      without deleting it, unpublish it instead. Member contributions on this
                      article are kept either way.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(post)}
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
                        Cancel
                      </button>
                    </div>
                  </Alert>
                ) : (
                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-5">
                    {busy && <Spinner className="h-3.5 w-3.5 text-burgundy" />}

                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>

                    <Link
                      href={`/admin/blog/${post.id}/preview`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-charcoal underline-offset-4 hover:text-burgundy hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Link>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void togglePublished(post)}
                      className="text-sm font-medium text-charcoal underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                    >
                      {isPublished ? "Unpublish" : "Publish"}
                    </button>

                    {isPublished && (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline"
                      >
                        View on site
                      </Link>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(post.id)}
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

      {/* Import is still available once posts exist, for topping up after a
          new article is added to lib/articles.ts. */}
      {!isLoading && !loadError && counts.total > 0 && (
        <div className="mt-10 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy disabled:opacity-60"
          >
            {importing ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
            {importing ? "Importing…" : "Import any built-in articles not yet in the database"}
          </button>
        </div>
      )}
    </div>
  );
}
