import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Small status chip for moderation states and post states.
 * The label always spells the state out, so the colour is reinforcement only.
 */

type Tone = "pending" | "approved" | "rejected" | "neutral" | "brand";

const tones: Record<Tone, string> = {
  pending: "border-burgundy/25 bg-burgundy-tint/60 text-burgundy-deep",
  approved: "border-success/30 bg-success/[0.08] text-success",
  rejected: "border-danger/25 bg-danger/[0.06] text-danger",
  neutral: "border-line bg-beige-light text-muted",
  brand: "border-burgundy bg-burgundy text-cream",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Maps a moderation status onto its chip tone. */
export function statusTone(status: string): Tone {
  if (status === "approved" || status === "published") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "neutral";
}
