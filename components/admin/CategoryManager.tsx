"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Layers, Pencil, Plus, Trash } from "@/components/ui/Icons";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/services/categories";
import { isAbort } from "@/services/api-client";
import type { AdminCategory } from "@/lib/category-types";
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  emptyCategoryValues,
  hasCategoryErrors,
  validateCategory,
  type CategoryFieldErrors,
  type CategoryValues,
} from "@/lib/category-validation";
import { slugify } from "@/lib/sanitize";

/**
 * Category management.
 *
 * Posts reference a category by name, so two operations need care and the UI
 * says so plainly:
 *
 *  - Renaming rewrites the name on every post that used it (the server does
 *    this atomically); the count is shown up front.
 *  - Deleting a category that is still in use requires choosing where its posts
 *    should go. The last remaining category can't be deleted at all.
 */

export function CategoryManager() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // One form serves both create and edit; `editingId` decides which.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<CategoryValues>(emptyCategoryValues);
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchCategories>>) => {
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
    apply(await fetchCategories());
  }, [apply]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchCategories(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  function openCreate() {
    setEditingId(null);
    setValues({ ...emptyCategoryValues, order: String(items.length) });
    setErrors({});
    setSubmitted(false);
    setSlugLocked(false);
    setShowForm(true);
    setNotice(null);
    setActionError(null);
  }

  function openEdit(category: AdminCategory) {
    setEditingId(category.id);
    setValues({
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: String(category.order),
    });
    setErrors({});
    setSubmitted(false);
    setSlugLocked(true);
    setShowForm(true);
    setNotice(null);
    setActionError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setValues(emptyCategoryValues);
    setErrors({});
    setSubmitted(false);
  }

  function update<K extends keyof CategoryValues>(name: K, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Keep the slug in step with the name until the operator edits it.
      if (name === "name" && !slugLocked) next.slug = slugify(value);
      if (submitted) setErrors(validateCategory(next));
      return next;
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateCategory(values);
    setErrors(found);
    setSubmitted(true);
    if (hasCategoryErrors(found)) return;

    setSaving(true);
    setActionError(null);
    setNotice(null);

    const result = editingId
      ? await updateCategory(editingId, values)
      : await createCategory(values);

    setSaving(false);

    if (!result.ok) {
      setActionError(result.error.message);
      if (result.error.fieldErrors) {
        setErrors((current) => ({ ...current, ...result.error.fieldErrors }));
      }
      return;
    }

    const reassigned =
      editingId && "reassignedPosts" in result.data
        ? Number(result.data.reassignedPosts) || 0
        : 0;

    setNotice(
      editingId
        ? `“${result.data.category.name}” was updated${
            reassigned > 0
              ? ` and ${reassigned} post${reassigned === 1 ? "" : "s"} moved with it`
              : ""
          }.`
        : `“${result.data.category.name}” was created.`,
    );

    closeForm();
    void load();
  }

  async function confirmDelete(category: AdminCategory) {
    setBusyId(category.id);
    setActionError(null);
    setNotice(null);

    const result = await deleteCategory(category.id, reassignTo || undefined);
    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    const moved = result.data.reassignedPosts;
    setNotice(
      `“${category.name}” was deleted${
        moved > 0
          ? ` and ${moved} post${moved === 1 ? "" : "s"} moved to “${result.data.reassignedTo}”`
          : ""
      }.`,
    );

    setDeletingId(null);
    setReassignTo("");
    void load();
  }

  const isLastCategory = items.length <= 1;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Categories</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Categories organise the blog and drive the filter row on the public index. Posts
            reference them by name, so renaming one updates every post that uses it.
          </p>
        </div>
        {!showForm && (
          <Button type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New category
            </span>
          </Button>
        )}
      </div>

      {notice && (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-6" title="That didn't work">
          {actionError}
        </Alert>
      )}

      {/* Create / edit form */}
      {showForm && (
        <form
          onSubmit={save}
          noValidate
          className="mt-7 rounded-[6px] border border-line bg-cream p-6 shadow-soft"
        >
          <h3 className="font-serif text-lg text-ink">
            {editingId ? "Edit category" : "New category"}
          </h3>

          {editingId &&
            (items.find((c) => c.id === editingId)?.postCount ?? 0) > 0 && (
              <Alert tone="info" className="mt-4">
                Renaming this category will also update{" "}
                {items.find((c) => c.id === editingId)?.postCount} post
                {items.find((c) => c.id === editingId)?.postCount === 1 ? "" : "s"} that use it.
              </Alert>
            )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="category-name"
              label="Name"
              error={submitted ? errors.name : undefined}
              hint={`${values.name.length} / ${NAME_MAX}`}
            >
              <TextInput
                id="category-name"
                value={values.name}
                maxLength={NAME_MAX}
                disabled={saving}
                placeholder="Venture Building"
                hasError={Boolean(submitted && errors.name)}
                onChange={(event) => update("name", event.target.value)}
              />
            </Field>

            <Field
              id="category-slug"
              label="Slug"
              error={submitted ? errors.slug : undefined}
              description="Lowercase, hyphenated. Used for filtering and future category pages."
            >
              <TextInput
                id="category-slug"
                value={values.slug}
                disabled={saving}
                placeholder="venture-building"
                hasError={Boolean(submitted && errors.slug)}
                onChange={(event) => {
                  setSlugLocked(true);
                  update("slug", event.target.value);
                }}
                onBlur={(event) => update("slug", slugify(event.target.value))}
              />
            </Field>

            <Field
              id="category-order"
              label="Display order"
              error={submitted ? errors.order : undefined}
              description="Lower numbers appear first in the filter row."
            >
              <TextInput
                id="category-order"
                type="number"
                min={0}
                max={999}
                value={values.order}
                disabled={saving}
                hasError={Boolean(submitted && errors.order)}
                onChange={(event) => update("order", event.target.value)}
              />
            </Field>

            <Field
              id="category-description"
              label="Description"
              optional
              error={submitted ? errors.description : undefined}
              hint={`${values.description.length} / ${DESCRIPTION_MAX}`}
              className="sm:col-span-2"
            >
              <TextArea
                id="category-description"
                rows={2}
                value={values.description}
                maxLength={DESCRIPTION_MAX}
                disabled={saving}
                placeholder="Internal note — not shown on the public site."
                hasError={Boolean(submitted && errors.description)}
                onChange={(event) => update("description", event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Saving…
                </span>
              ) : editingId ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingBlock label="Loading categories…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-8"
          title="We couldn't load the categories"
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
        <EmptyState
          className="mt-8"
          icon={<Layers className="h-5 w-5" />}
          title="No categories yet"
          description="The blog is using the built-in default categories. Create one here, or import the built-in articles from the Blog screen to seed the defaults."
          action={
            <Button type="button" onClick={openCreate}>
              Create the first category
            </Button>
          }
        />
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((category) => {
            const busy = busyId === category.id;
            const isDeleting = deletingId === category.id;
            const others = items.filter((c) => c.id !== category.id);

            return (
              <li
                key={category.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-ink">{category.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      <code className="font-mono">{category.slug}</code>
                      {" · order "}
                      {category.order}
                      {" · "}
                      {category.postCount} post{category.postCount === 1 ? "" : "s"}
                    </p>
                    {category.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {busy && <Spinner className="h-4 w-4 text-burgundy" />}
                </div>

                {isDeleting ? (
                  <Alert tone="error" className="mt-4" title={`Delete “${category.name}”?`}>
                    {isLastCategory ? (
                      <p>
                        This is the last category. Create another one before deleting this, so
                        posts always have somewhere to belong.
                      </p>
                    ) : (
                      <>
                        {category.postCount > 0 ? (
                          <>
                            <p>
                              {category.postCount} post
                              {category.postCount === 1 ? "" : "s"} use this category. Choose
                              where {category.postCount === 1 ? "it" : "they"} should move to.
                            </p>
                            <div className="mt-3 max-w-xs">
                              <label htmlFor={`reassign-${category.id}`} className="sr-only">
                                Move posts to
                              </label>
                              <Select
                                id={`reassign-${category.id}`}
                                value={reassignTo}
                                onChange={(event) => setReassignTo(event.target.value)}
                              >
                                <option value="">Choose a category…</option>
                                {others.map((other) => (
                                  <option key={other.id} value={other.name}>
                                    {other.name}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          </>
                        ) : (
                          <p>
                            No posts use this category, so nothing else will change.
                          </p>
                        )}
                      </>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {!isLastCategory && (
                        <button
                          type="button"
                          disabled={busy || (category.postCount > 0 && !reassignTo)}
                          onClick={() => void confirmDelete(category)}
                          className="inline-flex items-center gap-2 rounded-[3px] bg-danger px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? <Spinner /> : <Trash className="h-3.5 w-3.5" />}
                          {busy ? "Deleting…" : "Delete category"}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setDeletingId(null);
                          setReassignTo("");
                        }}
                        className="text-sm font-medium underline underline-offset-4 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </Alert>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingId(category.id);
                        setReassignTo("");
                      }}
                      className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline"
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
    </div>
  );
}
