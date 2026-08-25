import type { IconName } from "@/components/ui/Icons";

export type Principle = {
  index: string;
  icon: IconName;
  title: string;
  description: string;
};

/**
 * The firm's stated operating philosophy. These are principles/values —
 * not factual claims about track record — and are reused on Home and About.
 */
export const principles: Principle[] = [
  {
    index: "01",
    icon: "horizon",
    title: "Long-Term Thinking",
    description:
      "We measure success in years, not quarters. The ventures worth building are the ones designed to compound, so we look past the immediate opportunity to what it can genuinely become.",
  },
  {
    index: "02",
    icon: "spark",
    title: "Entrepreneurial Mindset",
    description:
      "We think like builders because we are. That means staying close to the work, bringing an operator's instinct to every decision, and doing the unglamorous things that matter.",
  },
  {
    index: "03",
    icon: "link",
    title: "Strategic Partnership",
    description:
      "Capital is only part of the equation. We bring perspective, relationships, and judgment — and we stay involved well beyond the initial commitment.",
  },
  {
    index: "04",
    icon: "ascend",
    title: "Shared Success",
    description:
      "The strongest partnerships are the ones where everyone wins together. We align our involvement with the long-term value we help create.",
  },
];
