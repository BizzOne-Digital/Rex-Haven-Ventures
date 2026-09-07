import { SERVICE_ICONS, isServiceIcon } from "@/lib/service-types";

/**
 * Shared service validation, used by the admin form and the API.
 * No framework imports; safe on both sides.
 */

/** Form values. Text fields are strings so the form and the wire agree. */
export type ServiceValues = {
  title: string;
  slug: string;
  icon: string;
  tagline: string;
  summary: string;
  intro: string;
  valueProp: string;
  /** One bullet per line — the form edits a textarea, the API splits it. */
  involves: string;
  forWho: string;
  ctaLabel: string;
  ctaHref: string;
  /** Public URL of the panel image, or "" for the built-in artwork. */
  image: string;
  order: string;
  showOnHome: boolean;
  published: boolean;
};

export type ServiceFieldErrors = Partial<Record<keyof ServiceValues, string>>;

export const TITLE_MAX = 80;
export const TAGLINE_MAX = 120;
export const SUMMARY_MAX = 300;
export const INTRO_MAX = 2000;
export const VALUE_PROP_MAX = 600;
export const FOR_WHO_MAX = 400;
export const CTA_LABEL_MAX = 40;
export const INVOLVES_MAX = 10;

export const emptyServiceValues: ServiceValues = {
  title: "",
  slug: "",
  icon: "compass",
  tagline: "",
  summary: "",
  intro: "",
  valueProp: "",
  involves: "",
  forWho: "",
  ctaLabel: "Start a Conversation",
  ctaHref: "/contact",
  image: "",
  order: "0",
  showOnHome: true,
  published: true,
};

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidServiceSlug(slug: string): boolean {
  return slugRe.test(slug) && slug.length <= 80;
}

/** Splits the textarea into bullets, dropping blank lines. */
export function parseInvolves(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, INVOLVES_MAX);
}

/**
 * A call-to-action target. Site-relative paths and absolute http(s) URLs are
 * both legitimate here (a service may point at an external application form);
 * anything else — `javascript:` above all — is not.
 */
export function isValidCtaHref(href: string): boolean {
  if (href.startsWith("/")) return true;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateService(values: Partial<ServiceValues>): ServiceFieldErrors {
  const errors: ServiceFieldErrors = {};
  const v = { ...emptyServiceValues, ...values };

  const title = v.title.trim();
  if (!title) errors.title = "Please enter a service name.";
  else if (title.length > TITLE_MAX) errors.title = `Keep the name under ${TITLE_MAX} characters.`;

  const slug = v.slug.trim();
  if (!slug) errors.slug = "Please add a URL slug.";
  else if (!isValidServiceSlug(slug))
    errors.slug = "Use lowercase letters, numbers and single hyphens (e.g. venture-building).";

  const tagline = v.tagline.trim();
  if (!tagline) errors.tagline = "A one-line positioning statement is what the card leads with.";
  else if (tagline.length > TAGLINE_MAX)
    errors.tagline = `Keep the tagline under ${TAGLINE_MAX} characters.`;

  const summary = v.summary.trim();
  if (!summary) errors.summary = "The summary is the card copy on the homepage.";
  else if (summary.length > SUMMARY_MAX)
    errors.summary = `Keep the summary under ${SUMMARY_MAX} characters.`;

  const intro = v.intro.trim();
  if (!intro) errors.intro = "The intro opens this service's section on the Services page.";
  else if (intro.length > INTRO_MAX)
    errors.intro = `Keep the intro under ${INTRO_MAX} characters.`;

  if (v.valueProp.trim().length > VALUE_PROP_MAX)
    errors.valueProp = `Keep the value proposition under ${VALUE_PROP_MAX} characters.`;

  if (v.forWho.trim().length > FOR_WHO_MAX)
    errors.forWho = `Keep this under ${FOR_WHO_MAX} characters.`;

  if (!isServiceIcon(v.icon)) errors.icon = `Choose one of: ${SERVICE_ICONS.join(", ")}.`;

  if (parseInvolves(v.involves).length === 0)
    errors.involves = "Add at least one line describing what the engagement involves.";

  const ctaLabel = v.ctaLabel.trim();
  if (!ctaLabel) errors.ctaLabel = "Give the button a label.";
  else if (ctaLabel.length > CTA_LABEL_MAX)
    errors.ctaLabel = `Keep the button label under ${CTA_LABEL_MAX} characters.`;

  const ctaHref = v.ctaHref.trim();
  if (!ctaHref) errors.ctaHref = "Where should the button go?";
  else if (!isValidCtaHref(ctaHref))
    errors.ctaHref = "Use a site path like /contact, or a full https:// URL.";

  const order = Number(v.order);
  if (!Number.isFinite(order) || order < 0 || order > 999)
    errors.order = "Order must be a number between 0 and 999.";

  return errors;
}

export function hasServiceErrors(errors: ServiceFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
