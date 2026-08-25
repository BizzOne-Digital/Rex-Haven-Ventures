import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRight } from "@/components/ui/Icons";

type Variant = "primary" | "outline" | "light" | "lightOutline";
type Size = "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  fullWidth?: boolean;
};

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-[3px] font-medium tracking-[0.01em] leading-none transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-burgundy text-cream shadow-soft hover:bg-burgundy-warm hover:shadow-lift active:translate-y-px",
  outline:
    "border border-burgundy/25 text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-cream",
  light: "bg-cream text-burgundy-deep shadow-soft hover:bg-beige active:translate-y-px",
  lightOutline: "border border-cream/40 text-cream hover:bg-cream/10 hover:border-cream/70",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-[1.05rem] text-[0.95rem]",
};

function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  withArrow = false,
  className,
  type = "button",
  onClick,
  disabled,
  fullWidth,
  ...aria
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

  const inner = (
    <>
      <span>{children}</span>
      {withArrow && (
        <ArrowRight className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 ease-out group-hover:translate-x-1" />
      )}
    </>
  );

  if (href) {
    if (isExternal(href)) {
      const isHttp = /^https?:/.test(href);
      return (
        <a
          href={href}
          onClick={onClick}
          className={classes}
          {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...aria}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={classes} {...aria}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes} {...aria}>
      {inner}
    </button>
  );
}
