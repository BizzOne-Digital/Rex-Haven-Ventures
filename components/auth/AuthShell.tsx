import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Icons";

/**
 * Page shell for the sign-in / sign-up / admin sign-in pages.
 *
 * Reuses the site's editorial furniture — the arch motif from `PageHero`, the
 * eyebrow label, the serif display heading — so these pages read as part of the
 * original design rather than a bolted-on auth screen. Top padding clears the
 * fixed header exactly as `PageHero` does.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  backLink = { href: "/", label: "Back to the site" },
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  backLink?: { href: string; label: string } | null;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-cream pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Decorative arch motif, mirroring PageHero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-16 -z-10 opacity-50"
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

      <Container size="default">
        <div className="mx-auto w-full max-w-lg">
          {backLink && (
            <Reveal>
              <Link
                href={backLink.href}
                className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy"
              >
                <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                {backLink.label}
              </Link>
            </Reveal>
          )}

          <Reveal className="mt-8">
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>

          <Reveal as="h1" delay={80} className="display-3 mt-5 text-ink">
            {title}
          </Reveal>

          {description && (
            <Reveal as="p" delay={140} className="mt-5 leading-relaxed text-muted">
              {description}
            </Reveal>
          )}

          <Reveal delay={200} className="mt-10">
            <div className="rounded-[6px] border border-line bg-cream p-6 shadow-soft sm:p-8">
              {children}
            </div>
          </Reveal>

          {footer && (
            <Reveal delay={260} className="mt-8 text-center text-sm text-muted">
              {footer}
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
