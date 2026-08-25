import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icons";

type Tone = "burgundy" | "ink" | "light";

const tones: Record<Tone, string> = {
  burgundy: "text-burgundy",
  ink: "text-ink",
  light: "text-cream",
};

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

/** Inline text link with an animated underline and directional icon. */
export function TextLink({
  href,
  children,
  tone = "burgundy",
  icon = "right",
  className,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  icon?: "right" | "upRight" | "none";
  className?: string;
  "aria-label"?: string;
}) {
  const IconCmp = icon === "upRight" ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span className="link-underline">{children}</span>
      {icon !== "none" && (
        <IconCmp
          className={cn(
            "h-4 w-4 transition-transform duration-300 ease-out",
            icon === "upRight"
              ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              : "group-hover:translate-x-1",
          )}
        />
      )}
    </>
  );

  const classes = cn(
    "group inline-flex items-center gap-2 text-sm font-medium tracking-wide",
    tones[tone],
    className,
  );

  if (isExternal(href)) {
    const isHttp = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
