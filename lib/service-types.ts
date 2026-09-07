/**
 * Wire shapes for services. Pure types and values, no imports, shared by the
 * route handlers that produce them and by both the public site and the admin
 * screen that consume them.
 */

/** Icons offered in the admin picker. Must stay a subset of the Icon registry. */
export const SERVICE_ICONS = [
  "compass",
  "layers",
  "trend",
  "orbit",
  "spark",
  "horizon",
  "link",
  "ascend",
] as const;

export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export function isServiceIcon(value: unknown): value is ServiceIcon {
  return typeof value === "string" && (SERVICE_ICONS as readonly string[]).includes(value);
}

/**
 * A service as the public site renders it.
 *
 * `index` ("01", "02", …) is assigned when a list is built rather than stored,
 * so hiding a service renumbers the rest instead of leaving a gap.
 */
export type PublicService = {
  id: string;
  slug: string;
  index: string;
  icon: ServiceIcon;
  title: string;
  tagline: string;
  summary: string;
  intro: string;
  valueProp: string;
  involves: string[];
  forWho: string;
  /** Panel image URL, or `null` for the built-in gradient-and-icon artwork. */
  image: string | null;
  cta: { label: string; href: string };
};

/** Everything the admin screen needs on top of the public shape. */
export type AdminService = PublicService & {
  order: number;
  /** Whether the homepage "What We Do" grid includes this service. */
  showOnHome: boolean;
  /** Unpublished services are hidden everywhere on the public site. */
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
