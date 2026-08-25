import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TextLink } from "@/components/ui/TextLink";
import { cn } from "@/lib/cn";

type Audience = {
  label: string;
  heading: string;
  description: string;
  points: string[];
  cta: { label: string; href: string };
  tone: "cream" | "burgundy";
};

const audiences: Audience[] = [
  {
    label: "For Entrepreneurs",
    heading: "You're building something. We help it become something bigger.",
    description:
      "Bring us an idea with conviction behind it. We bring capital, perspective, and a partner who stays in the room when the work gets hard.",
    points: [
      "Early-stage capital and venture building",
      "Hands-on strategy and operational support",
      "Introductions that open real doors",
    ],
    cta: { label: "Partner With Us", href: "/contact" },
    tone: "cream",
  },
  {
    label: "For Investors",
    heading: "You're looking for opportunity. We help you find and shape it.",
    description:
      "We work with investors who value discipline and alignment — identifying opportunities with genuine potential and staying involved to help them compound.",
    points: [
      "Access to considered, long-horizon opportunities",
      "Aligned incentives and transparent partnership",
      "Active involvement beyond the initial commitment",
    ],
    cta: { label: "Explore Opportunities", href: "/contact" },
    tone: "burgundy",
  },
];

function Panel({ audience, delay }: { audience: Audience; delay: number }) {
  const isBurgundy = audience.tone === "burgundy";
  return (
    <Reveal className="h-full" delay={delay}>
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[6px] p-9 md:p-12",
          isBurgundy
            ? "bg-burgundy-deep text-cream"
            : "border border-line bg-cream text-ink shadow-soft",
        )}
      >
        <span
          className={cn(
            "eyebrow",
            isBurgundy ? "text-cream/65" : "text-burgundy",
          )}
        >
          {audience.label}
        </span>
        <h3
          className={cn(
            "mt-6 font-serif text-[1.75rem] leading-snug md:text-3xl",
            isBurgundy ? "text-cream" : "text-ink",
          )}
        >
          {audience.heading}
        </h3>
        <p
          className={cn(
            "mt-5 leading-relaxed",
            isBurgundy ? "text-cream/75" : "text-muted",
          )}
        >
          {audience.description}
        </p>

        <ul className="mt-8 flex flex-col gap-3.5">
          {audience.points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span
                aria-hidden
                className={cn(
                  "mt-2.5 h-px w-4 shrink-0",
                  isBurgundy ? "bg-burgundy-soft" : "bg-burgundy",
                )}
              />
              <span
                className={cn(
                  "text-[0.95rem]",
                  isBurgundy ? "text-cream/85" : "text-charcoal/85",
                )}
              >
                {point}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <TextLink href={audience.cta.href} tone={isBurgundy ? "light" : "burgundy"}>
            {audience.cta.label}
          </TextLink>
        </div>
      </div>
    </Reveal>
  );
}

export function AudienceSection() {
  return (
    <section className="bg-beige-light py-24 md:py-32">
      <Container size="wide">
        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          {audiences.map((audience, i) => (
            <Panel key={audience.label} audience={audience} delay={i * 120} />
          ))}
        </div>
      </Container>
    </section>
  );
}
