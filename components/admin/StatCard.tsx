import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRight } from "@/components/ui/Icons";
import { SkeletonBar } from "@/components/ui/Spinner";

/**
 * Dashboard metric tile.
 *
 * `tone` highlights a figure that needs attention — pending moderation is the
 * one number an administrator should act on, so it gets the brand accent while
 * everything else stays neutral.
 */

type Tone = "default" | "attention" | "positive" | "muted";

const tones: Record<Tone, { card: string; value: string }> = {
  default: { card: "border-line bg-cream", value: "text-ink" },
  attention: { card: "border-burgundy/30 bg-burgundy-tint/40", value: "text-burgundy-deep" },
  positive: { card: "border-success/25 bg-success/[0.04]", value: "text-success" },
  muted: { card: "border-line bg-beige-light/60", value: "text-muted" },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
  linkLabel,
  isLoading,
}: {
  label: ReactNode;
  value: number | string;
  hint?: ReactNode;
  tone?: Tone;
  href?: string;
  linkLabel?: string;
  isLoading?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      {isLoading ? (
        <SkeletonBar className="mt-3 h-8 w-16" />
      ) : (
        <p className={cn("mt-2 font-serif text-4xl leading-none", tones[tone].value)}>{value}</p>
      )}
      {hint && <p className="mt-3 text-xs leading-relaxed text-muted">{hint}</p>}
      {href && linkLabel && (
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-burgundy">
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      )}
    </>
  );

  const className = cn(
    "flex flex-col rounded-[6px] border p-5 transition-[border-color,box-shadow] duration-300",
    tones[tone].card,
    href && "group hover:border-burgundy/40 hover:shadow-soft",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
