import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "burgundy" | "muted" | "light";

const tones: Record<Tone, string> = {
  burgundy: "text-burgundy",
  muted: "text-muted",
  light: "text-cream/70",
};

export function Eyebrow({
  children,
  tone = "burgundy",
  withRule = true,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  withRule?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-3", tones[tone], className)}>
      {withRule && <span aria-hidden className="h-px w-7 bg-current opacity-45" />}
      {children}
    </span>
  );
}
