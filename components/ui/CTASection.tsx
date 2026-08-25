import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

type Action = { label: string; href: string };

type CTASectionProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primary?: Action;
  secondary?: Action;
  tone?: "burgundy" | "cream";
  className?: string;
};

/** Conversion band reused as the closing call-to-action across pages. */
export function CTASection({
  eyebrow,
  title,
  description,
  primary = { label: "Start a Conversation", href: "/contact" },
  secondary,
  tone = "burgundy",
  className,
}: CTASectionProps) {
  const isBurgundy = tone === "burgundy";
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <div
        className={cn(
          "relative",
          isBurgundy ? "bg-burgundy-deep text-cream" : "bg-beige-light text-ink",
        )}
      >
        {/* Arch motif backdrop */}
        {isBurgundy && (
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]">
            <svg
              className="absolute left-1/2 top-1/2 h-[140%] w-auto -translate-x-1/2 -translate-y-1/2"
              viewBox="0 0 400 300"
              fill="none"
              stroke="currentColor"
              strokeWidth={0.75}
              preserveAspectRatio="xMidYMid slice"
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const r = 40 + i * 40;
                return <path key={i} d={`M${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`} />;
              })}
            </svg>
          </div>
        )}

        <Container className="relative py-20 md:py-28">
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {eyebrow && (
              <Eyebrow tone={isBurgundy ? "light" : "burgundy"} className="mb-6">
                {eyebrow}
              </Eyebrow>
            )}
            <h2 className={cn("display-2", isBurgundy ? "text-cream" : "text-ink")}>{title}</h2>
            {description && (
              <p
                className={cn(
                  "lead mt-6 max-w-2xl",
                  isBurgundy ? "text-cream/75" : "text-muted",
                )}
              >
                {description}
              </p>
            )}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              {primary && (
                <Button
                  href={primary.href}
                  size="lg"
                  variant={isBurgundy ? "light" : "primary"}
                  withArrow
                >
                  {primary.label}
                </Button>
              )}
              {secondary && (
                <Button
                  href={secondary.href}
                  size="lg"
                  variant={isBurgundy ? "lightOutline" : "outline"}
                >
                  {secondary.label}
                </Button>
              )}
            </div>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
