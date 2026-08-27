export type ServiceIcon = "compass" | "layers" | "trend" | "orbit" | "spark";

export type Service = {
  id: string;
  slug: string;
  index: string;
  icon: ServiceIcon;
  title: string;
  /** One-line positioning used on cards. */
  tagline: string;
  /** Short card description used on the homepage overview. */
  summary: string;
  /** Opening paragraph on the Services page. */
  intro: string;
  /** The core value proposition. */
  valueProp: string;
  /** Concrete elements of the engagement. */
  involves: string[];
  /** Who the service is designed for. */
  forWho: string;
  cta: { label: string; href: string };
};

export const services: Service[] = [
  {
    id: "investment",
    slug: "investment",
    index: "01",
    icon: "compass",
    title: "Investment",
    tagline: "Capital with a long-term perspective.",
    summary:
      "Help identify and pursue promising opportunities with a long-term perspective.",
    intro:
      "We approach investment as a long-horizon discipline — looking past the headline opportunity to understand what a business can genuinely become.",
    valueProp:
      "Considered capital and clear thinking, directed toward opportunities with durable potential rather than short-lived momentum.",
    involves: [
      "Evaluating opportunities against a long-term thesis",
      "Understanding the fundamentals behind the idea",
      "Structuring involvement that aligns incentives",
      "Ongoing, hands-on support beyond the initial commitment",
    ],
    forWho:
      "Founders and opportunity-holders seeking a partner who brings perspective as well as capital.",
    cta: { label: "Discuss an Investment", href: "/contact" },
  },
  {
    id: "venture-building",
    slug: "venture-building",
    index: "02",
    icon: "layers",
    title: "Venture Building",
    tagline: "From idea to enduring business.",
    summary:
      "Work alongside entrepreneurs to develop ideas, businesses, and growth opportunities.",
    intro:
      "Great businesses are built, not just backed. We work shoulder-to-shoulder with founders to shape ideas into companies designed to last.",
    valueProp:
      "Practical, involved partnership through the messy early work of turning a concept into a company with real momentum.",
    involves: [
      "Refining the idea, model, and go-to-market approach",
      "Shaping strategy and operational foundations",
      "Identifying and unlocking early growth opportunities",
      "Building the structure a company needs to scale",
    ],
    forWho:
      "Entrepreneurs with conviction and an early-stage idea or business ready for its next chapter.",
    cta: { label: "Talk With Us", href: "/contact" },
  },
  {
    id: "strategic-growth",
    slug: "strategic-growth",
    index: "03",
    icon: "trend",
    title: "Strategic Growth",
    tagline: "Momentum, made deliberate.",
    summary:
      "Support businesses with strategic thinking, partnerships, and opportunities for expansion.",
    intro:
      "For businesses ready to move faster, we bring the strategic clarity and relationships that turn potential into deliberate, compounding growth.",
    valueProp:
      "A sharper strategic lens and a network of relationships that help a business expand with intent instead of guesswork.",
    involves: [
      "Pressure-testing the growth strategy",
      "Opening doors through relationships and partnerships",
      "Identifying new markets and expansion paths",
      "Aligning the organization behind the next stage",
    ],
    forWho:
      "Established businesses looking for the right strategic partner to reach their next stage.",
    cta: { label: "Explore a Partnership", href: "/contact" },
  },
  {
    id: "entrepreneurship",
    slug: "entrepreneurship-partnerships",
    index: "04",
    icon: "orbit",
    title: "Entrepreneurship & Partnerships",
    tagline: "Building alongside ambitious people.",
    summary:
      "Partner with ambitious founders who are building businesses with meaningful potential.",
    intro:
      "We are, at heart, partners to builders. We back ambitious founders and cultivate relationships across the ecosystem that create value on both sides.",
    valueProp:
      "A genuine, long-term partnership — one where our involvement is measured by the value we help create together.",
    involves: [
      "Backing founders with meaningful, long-term potential",
      "Connecting entrepreneurs, investors, and partners",
      "Sharing perspective, judgment, and hard-won lessons",
      "Building relationships intended to last beyond a single deal",
    ],
    forWho:
      "Ambitious founders and strategic partners who value a relationship over a transaction.",
    cta: { label: "Partner With Us", href: "/contact" },
  },
  {
    id: "launchpad",
    slug: "launchpad",
    index: "05",
    icon: "spark",
    title: "The $500 Launchpad",
    tagline: "A hand-up, not a hand-out.",
    summary:
      "A strategic $500 for high-impact, one-time uses that break through a bottleneck.",
    intro:
      "Introducing The $500 Launchpad—because sometimes a business doesn't need a million dollars; it needs a strategic $500 to break through a bottleneck. This isn't a hand-out; it's a hand-up. We lend this capital specifically for high-impact, one-time uses: a targeted ad campaign, a bulk inventory purchase, a essential piece of software, or a professional photoshoot that doubles conversion rates. Here’s how we present it: Clear. Fast. Human. No predatory interest spirals—just a simple, fixed 5% one-time fee, a 90-day repayment term, and a 5-minute video application where you tell us your 'one-thing' goal. We feature each borrower on our 'Progress Wall,' celebrating wins and sharing lessons. We succeed only when you use that $500 to generate $750 in new revenue—and we'll provide a free calculator to help you project that ROI before you even apply. This is venture debt for the rest of us.",
    valueProp:
      "Clear, fast, and human capital access: a fixed 5% one-time fee, 90-day repayment, and a 5-minute video application focused on your one-thing goal.",
    involves: [
      "Fixed 5% one-time fee with no predatory interest spirals",
      "90-day repayment term aligned with your revenue cycle",
      "5-minute video application to share your one-thing goal",
      "Free ROI calculator to project returns before you apply",
      "Progress Wall feature to celebrate wins and share lessons",
    ],
    forWho:
      "Small business owners and operators who have a clear, high-impact use for $500 and need fast access to capital.",
    cta: { label: "Apply for the Launchpad", href: "/contact" },
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
