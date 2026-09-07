"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Icon, Layers, Pencil, Plus, Trash } from "@/components/ui/Icons";
import { LocalImageField } from "@/components/admin/LocalImageField";
import {
  createService,
  deleteService,
  fetchServices,
  seedServices,
  updateService,
} from "@/services/services";
import { isAbort } from "@/services/api-client";
import { SERVICE_ICONS, isServiceIcon, type AdminService } from "@/lib/service-types";
import {
  CTA_LABEL_MAX,
  INVOLVES_MAX,
  SUMMARY_MAX,
  TAGLINE_MAX,
  TITLE_MAX,
  emptyServiceValues,
  hasServiceErrors,
  parseInvolves,
  validateService,
  type ServiceFieldErrors,
  type ServiceValues,
} from "@/lib/service-validation";
import { slugify } from "@/lib/sanitize";

/**
 * Service management.
 *
 * The homepage's "What We Do" grid and the Services page both read from this
 * collection, and the two audiences differ: the homepage is a curated
 * shortlist, the Services page is the full catalogue. So each service carries
 * two independent switches, toggleable straight from the list without opening
 * the editor:
 *
 *   Published    off  ->  hidden from the whole public site
 *   On homepage  off  ->  still on /services, absent from the homepage grid
 *
 * Until the collection is seeded, the public pages fall back to the built-in
 * services in `lib/services.ts`. The empty state says so and offers the import,
 * so an administrator starts from the real copy rather than a blank form.
 */

/** Display numbers on the public site are positional, so preview them here. */
function positionLabel(position: number): string {
  return String(position + 1).padStart(2, "0");
}

export function ServiceManager() {
  const [items, setItems] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // One form serves both create and edit; `editingId` decides which.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<ServiceValues>(emptyServiceValues);
  const [errors, setErrors] = useState<ServiceFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchServices>>) => {
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
    apply(await fetchServices());
  }, [apply]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchServices(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  function openCreate() {
    setEditingId(null);
    setValues({ ...emptyServiceValues, order: String(items.length) });
    setErrors({});
    setSubmitted(false);
    setSlugLocked(false);
    setShowForm(true);
    setNotice(null);
    setActionError(null);
  }

  function openEdit(service: AdminService) {
    setEditingId(service.id);
    setValues({
      title: service.title,
      slug: service.slug,
      icon: service.icon,
      tagline: service.tagline,
      summary: service.summary,
      intro: service.intro,
      valueProp: service.valueProp,
      involves: service.involves.join("\n"),
      forWho: service.forWho,
      ctaLabel: service.cta.label,
      ctaHref: service.cta.href,
      image: service.image ?? "",
      order: String(service.order),
      showOnHome: service.showOnHome,
      published: service.published,
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
    setValues(emptyServiceValues);
    setErrors({});
    setSubmitted(false);
  }

  function update<K extends keyof ServiceValues>(name: K, value: ServiceValues[K]) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Keep the slug in step with the title until the operator edits it.
      if (name === "title" && !slugLocked) next.slug = slugify(String(value));
      if (submitted) setErrors(validateService(next));
      return next;
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateService(values);
    setErrors(found);
    setSubmitted(true);
    if (hasServiceErrors(found)) return;

    setSaving(true);
    setActionError(null);
    setNotice(null);

    const result = editingId
      ? await updateService(editingId, values)
      : await createService(values);

    setSaving(false);

    if (!result.ok) {
      setActionError(result.error.message);
      if (result.error.fieldErrors) setErrors(result.error.fieldErrors as ServiceFieldErrors);
      return;
    }

    setNotice(
      editingId
        ? `Saved “${result.data.service.title}”.`
        : `Created “${result.data.service.title}”.`,
    );
    closeForm();
    void load();
  }

  /** Flips one boolean from the list, without opening the editor. */
  async function toggle(service: AdminService, field: "published" | "showOnHome") {
    setBusyId(service.id);
    setActionError(null);
    setNotice(null);

    const next = !service[field];
    const result = await updateService(service.id, { [field]: next });

    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setNotice(
      field === "published"
        ? `“${service.title}” is now ${next ? "live on the site" : "hidden from the site"}.`
        : `“${service.title}” ${next ? "now appears" : "no longer appears"} in the homepage grid.`,
    );
    void load();
  }

  async function confirmDelete(service: AdminService) {
    setBusyId(service.id);
    setActionError(null);
    setNotice(null);

    const result = await deleteService(service.id);

    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setDeletingId(null);
    setNotice(`Deleted “${service.title}”.`);
    void load();
  }

  async function importBuiltIn() {
    setSeeding(true);
    setActionError(null);
    setNotice(null);

    const result = await seedServices();

    setSeeding(false);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setNotice(
      result.data.seeded > 0
        ? `Imported ${result.data.seeded} built-in service${result.data.seeded === 1 ? "" : "s"}.`
        : "Everything built in is already here.",
    );
    void load();
  }

  const homeCount = items.filter((item) => item.published && item.showOnHome).length;
  const liveCount = items.filter((item) => item.published).length;
  const involvesCount = parseInvolves(values.involves).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Services</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            These drive the homepage&rsquo;s &ldquo;What We Do&rdquo; grid and the Services page.
            Unpublish one to hide it everywhere; clear &ldquo;on homepage&rdquo; to keep it on{" "}
            <code className="font-mono text-[0.9em]">/services</code> but out of the grid.
          </p>
          {!isLoading && items.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {liveCount} live &middot; {homeCount} in the homepage grid &middot; {items.length}{" "}
              total
            </p>
          )}
        </div>
        {!showForm && (
          <Button type="button" onClick={openCreate}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New service
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
        <Alert tone="error" className="mt-6" title="That didn’t work">
          {actionError}
        </Alert>
      )}

      {/* The homepage grid is four across; more than four wraps to a second row. */}
      {!isLoading && homeCount > 4 && (
        <Alert tone="info" className="mt-6">
          {homeCount} services are set to show on the homepage. The grid is four across, so the
          rest wrap onto another row &mdash; intentional or not, it is worth a look at the
          homepage.
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
            {editingId ? "Edit service" : "New service"}
          </h3>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="service-title"
              label="Name"
              error={submitted ? errors.title : undefined}
              hint={`${values.title.length} / ${TITLE_MAX}`}
            >
              <TextInput
                id="service-title"
                value={values.title}
                maxLength={TITLE_MAX}
                disabled={saving}
                placeholder="Venture Building"
                hasError={Boolean(submitted && errors.title)}
                onChange={(event) => update("title", event.target.value)}
              />
            </Field>

            <Field
              id="service-slug"
              label="Slug"
              error={submitted ? errors.slug : undefined}
              description="Lowercase, hyphenated. Identifies the service internally."
            >
              <TextInput
                id="service-slug"
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
              id="service-tagline"
              label="Tagline"
              error={submitted ? errors.tagline : undefined}
              hint={`${values.tagline.length} / ${TAGLINE_MAX}`}
              description="The italic line under the name."
            >
              <TextInput
                id="service-tagline"
                value={values.tagline}
                maxLength={TAGLINE_MAX}
                disabled={saving}
                placeholder="From idea to enduring business."
                hasError={Boolean(submitted && errors.tagline)}
                onChange={(event) => update("tagline", event.target.value)}
              />
            </Field>

            <Field
              id="service-icon"
              label="Icon"
              error={submitted ? errors.icon : undefined}
              description="Shown on the card, and on the Services page when there is no panel image."
            >
              <div className="flex items-center gap-3">
                <Select
                  id="service-icon"
                  value={values.icon}
                  disabled={saving}
                  hasError={Boolean(submitted && errors.icon)}
                  onChange={(event) => update("icon", event.target.value)}
                >
                  {SERVICE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-burgundy/8 text-burgundy">
                  <Icon
                    name={isServiceIcon(values.icon) ? values.icon : "compass"}
                    className="h-5 w-5"
                  />
                </span>
              </div>
            </Field>

            <Field
              id="service-summary"
              label="Card summary"
              error={submitted ? errors.summary : undefined}
              hint={`${values.summary.length} / ${SUMMARY_MAX}`}
              description="The homepage card copy. One or two sentences."
              className="sm:col-span-2"
            >
              <TextArea
                id="service-summary"
                rows={2}
                value={values.summary}
                maxLength={SUMMARY_MAX}
                disabled={saving}
                hasError={Boolean(submitted && errors.summary)}
                onChange={(event) => update("summary", event.target.value)}
              />
            </Field>

            <Field
              id="service-intro"
              label="Intro"
              error={submitted ? errors.intro : undefined}
              description="Opens this service’s section on the Services page."
              className="sm:col-span-2"
            >
              <TextArea
                id="service-intro"
                rows={4}
                value={values.intro}
                disabled={saving}
                hasError={Boolean(submitted && errors.intro)}
                onChange={(event) => update("intro", event.target.value)}
              />
            </Field>

            <Field
              id="service-valueProp"
              label="Value proposition"
              optional
              error={submitted ? errors.valueProp : undefined}
              description="Rendered as the pull-quote beside the intro."
              className="sm:col-span-2"
            >
              <TextArea
                id="service-valueProp"
                rows={2}
                value={values.valueProp}
                disabled={saving}
                hasError={Boolean(submitted && errors.valueProp)}
                onChange={(event) => update("valueProp", event.target.value)}
              />
            </Field>

            <Field
              id="service-involves"
              label="What this involves"
              error={submitted ? errors.involves : undefined}
              hint={`${involvesCount} / ${INVOLVES_MAX}`}
              description="One bullet per line."
              className="sm:col-span-2"
            >
              <TextArea
                id="service-involves"
                rows={5}
                value={values.involves}
                disabled={saving}
                placeholder={"Refining the idea, model, and go-to-market approach\nShaping strategy and operational foundations"}
                hasError={Boolean(submitted && errors.involves)}
                onChange={(event) => update("involves", event.target.value)}
              />
            </Field>

            <Field
              id="service-forWho"
              label="Who it’s for"
              optional
              error={submitted ? errors.forWho : undefined}
              className="sm:col-span-2"
            >
              <TextArea
                id="service-forWho"
                rows={2}
                value={values.forWho}
                disabled={saving}
                hasError={Boolean(submitted && errors.forWho)}
                onChange={(event) => update("forWho", event.target.value)}
              />
            </Field>

            <Field
              id="service-ctaLabel"
              label="Button label"
              error={submitted ? errors.ctaLabel : undefined}
              hint={`${values.ctaLabel.length} / ${CTA_LABEL_MAX}`}
            >
              <TextInput
                id="service-ctaLabel"
                value={values.ctaLabel}
                maxLength={CTA_LABEL_MAX}
                disabled={saving}
                hasError={Boolean(submitted && errors.ctaLabel)}
                onChange={(event) => update("ctaLabel", event.target.value)}
              />
            </Field>

            <Field
              id="service-ctaHref"
              label="Button link"
              error={submitted ? errors.ctaHref : undefined}
              description="A site path like /contact, or a full https:// URL."
            >
              <TextInput
                id="service-ctaHref"
                value={values.ctaHref}
                disabled={saving}
                placeholder="/contact"
                hasError={Boolean(submitted && errors.ctaHref)}
                onChange={(event) => update("ctaHref", event.target.value)}
              />
            </Field>

            <LocalImageField
              className="sm:col-span-2"
              folder="pages"
              label="Panel image"
              description="Replaces the gradient-and-icon artwork beside this service on the Services page. Leave it empty to keep the built-in artwork."
              value={values.image}
              disabled={saving}
              onChange={(url) => update("image", url)}
            />

            <Field
              id="service-order"
              label="Display order"
              error={submitted ? errors.order : undefined}
              description="Lower numbers come first, everywhere."
            >
              <TextInput
                id="service-order"
                type="number"
                min={0}
                max={999}
                value={values.order}
                disabled={saving}
                hasError={Boolean(submitted && errors.order)}
                onChange={(event) => update("order", event.target.value)}
              />
            </Field>

            <div className="flex flex-col justify-center gap-4">
              <Checkbox
                id="service-published"
                label="Published"
                description="Off hides this service from the whole public site."
                checked={values.published}
                disabled={saving}
                onChange={(checked) => update("published", checked)}
              />
              <Checkbox
                id="service-showOnHome"
                label="Show in the homepage grid"
                description="Off keeps it on /services only."
                checked={values.showOnHome}
                disabled={saving}
                onChange={(checked) => update("showOnHome", checked)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Saving&hellip;
                </span>
              ) : editingId ? (
                "Save changes"
              ) : (
                "Create service"
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
        <LoadingBlock label="Loading services…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-8"
          title="We couldn’t load the services"
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
          title="No services yet"
          description="The public site is showing the built-in services. Import them to start editing the real copy, or write a new one from scratch."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" onClick={() => void importBuiltIn()} disabled={seeding}>
                {seeding ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Importing&hellip;
                  </span>
                ) : (
                  "Import the built-in services"
                )}
              </Button>
              <button
                type="button"
                onClick={openCreate}
                className="text-sm font-medium text-burgundy underline-offset-4 hover:underline"
              >
                Start from scratch
              </button>
            </div>
          }
        />
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((service, position) => {
            const busy = busyId === service.id;
            const isDeleting = deletingId === service.id;

            return (
              <li
                key={service.id}
                className="rounded-[6px] border border-line bg-cream p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-burgundy/8 text-burgundy">
                      <Icon name={service.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-ink">
                        <span className="index-num mr-2 text-sm text-muted/70">
                          {positionLabel(position)}
                        </span>
                        {service.title}
                      </p>
                      <p className="mt-1 text-sm text-burgundy/90">{service.tagline}</p>
                      <p className="mt-1 text-xs text-muted">
                        <code className="font-mono">{service.slug}</code>
                        {" · order "}
                        {service.order}
                        {service.image ? " · panel image" : ""}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                        {service.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {busy && <Spinner className="h-4 w-4 text-burgundy" />}
                    <span
                      className={
                        service.published
                          ? "rounded-full bg-burgundy/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-burgundy"
                          : "rounded-full bg-muted/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted"
                      }
                    >
                      {service.published ? "Live" : "Hidden"}
                    </span>
                  </div>
                </div>

                {isDeleting ? (
                  <Alert
                    tone="error"
                    className="mt-4"
                    title={`Delete “${service.title}”?`}
                  >
                    <p>
                      This removes the service from the homepage grid and the Services page, and
                      deletes its panel image. It can&rsquo;t be undone &mdash; unpublish it
                      instead if you may want it back.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void confirmDelete(service)}
                        className="inline-flex items-center gap-2 rounded-[3px] bg-danger px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? <Spinner /> : <Trash className="h-3.5 w-3.5" />}
                        {busy ? "Deleting…" : "Delete service"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeletingId(null)}
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
                      onClick={() => openEdit(service)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={service.showOnHome}
                        disabled={busy}
                        onChange={() => void toggle(service, "showOnHome")}
                        className="h-4 w-4 rounded-[2px] border-line accent-[var(--color-burgundy)]"
                      />
                      On homepage
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={service.published}
                        disabled={busy}
                        onChange={() => void toggle(service, "published")}
                        className="h-4 w-4 rounded-[2px] border-line accent-[var(--color-burgundy)]"
                      />
                      Published
                    </label>

                    <button
                      type="button"
                      onClick={() => setDeletingId(service.id)}
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
