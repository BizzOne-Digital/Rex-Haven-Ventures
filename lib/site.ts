export const siteConfig = {
  name: "Rex Haven Ventures",
  shortName: "Rex Haven",
  // Update this to the production domain when deploying,
  // or set NEXT_PUBLIC_SITE_URL in the environment.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rexhavenventures.com",
  tagline: "Investing. Building. Growing.",
  description:
    "Rex Haven Ventures partners with entrepreneurs and investors to identify opportunities, build businesses, and create long-term value.",
  contact: {
    email: "rexhavenventures@gmail.com",
    phone: "+1 646-969-1719",
    // E.164 for tel: links
    phoneHref: "+16469691719",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const mailtoHref = `mailto:${siteConfig.contact.email}`;
export const telHref = `tel:${siteConfig.contact.phoneHref}`;
