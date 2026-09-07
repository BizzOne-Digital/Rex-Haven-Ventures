import "server-only";
import { sanitizeImageUrl, sanitizeText, slugify } from "@/lib/sanitize";
import { parseInvolves, type ServiceValues } from "@/lib/service-validation";
import type { ServiceIcon } from "@/lib/service-types";

/**
 * Turns validated admin input into the fields stored on a Service.
 *
 * Every string is stripped of markup: the service components render plain text
 * nodes, so a tag would appear as literal characters rather than formatting.
 * Stripping keeps what's stored and what's rendered honest with each other.
 *
 * Call only on values `validateService` has already accepted — that is what
 * guarantees `icon` holds a member of the icon set and `ctaHref` a safe target.
 */

export type ServicePayload = {
  slug: string;
  title: string;
  icon: ServiceIcon;
  tagline: string;
  summary: string;
  intro: string;
  valueProp?: string;
  involves: string[];
  forWho?: string;
  ctaLabel: string;
  ctaHref: string;
  image?: string;
  order: number;
  showOnHome: boolean;
  published: boolean;
};

export function buildServicePayload(values: ServiceValues): ServicePayload {
  const valueProp = sanitizeText(values.valueProp);
  const forWho = sanitizeText(values.forWho);
  // `sanitizeImageUrl` is the same guard blog covers use: site-relative paths
  // and http(s) only, so `javascript:` can't reach an `<img src>`.
  const image = sanitizeImageUrl(values.image);

  return {
    slug: slugify(values.slug) || slugify(values.title),
    title: sanitizeText(values.title),
    icon: values.icon as ServiceIcon,
    tagline: sanitizeText(values.tagline),
    summary: sanitizeText(values.summary),
    intro: sanitizeText(values.intro),
    valueProp: valueProp || undefined,
    involves: parseInvolves(values.involves).map(sanitizeText).filter(Boolean),
    forWho: forWho || undefined,
    ctaLabel: sanitizeText(values.ctaLabel),
    // Not run through `sanitizeText`: it is a URL, already validated, and
    // stripping "tag-shaped" substrings would corrupt a legitimate query string.
    ctaHref: values.ctaHref.trim(),
    image: image || undefined,
    order: Number(values.order),
    showOnHome: Boolean(values.showOnHome),
    published: Boolean(values.published),
  };
}
