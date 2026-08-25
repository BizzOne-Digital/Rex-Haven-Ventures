import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type PageHeroProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
};

/** Consistent interior-page hero. Adds top padding to clear the fixed header. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = "left",
}: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-cream pt-36 pb-16 md:pt-44 md:pb-24">
      {/* Decorative arch motif, upper-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-10 -z-10 opacity-[0.5]"
      >
        <svg
          width="520"
          height="420"
          viewBox="0 0 400 300"
          fill="none"
          stroke="var(--color-burgundy)"
          strokeWidth={0.7}
          className="opacity-25"
        >
          {Array.from({ length: 7 }).map((_, i) => {
            const r = 30 + i * 32;
            return <path key={i} d={`M${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`} />;
          })}
        </svg>
      </div>

      <Container size="wide">
        <div
          className={cn(
            "flex max-w-3xl flex-col",
            align === "center" && "mx-auto items-center text-center",
          )}
        >
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Reveal as="h1" delay={80} className="display-1 mt-6 text-ink">
            {title}
          </Reveal>
          {description && (
            <Reveal
              as="p"
              delay={170}
              className={cn("lead mt-7", align === "center" && "mx-auto")}
            >
              {description}
            </Reveal>
          )}
          {children && <div className="mt-9">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
