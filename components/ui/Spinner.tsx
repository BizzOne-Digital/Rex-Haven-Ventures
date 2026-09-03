import { cn } from "@/lib/cn";

/**
 * Loading indicator. Purely decorative — the surrounding region carries the
 * accessible label, so this is hidden from assistive technology.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70",
        className,
      )}
    />
  );
}

/** Centred loading block for panels and tables. */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 py-16 text-sm text-muted"
    >
      <Spinner className="text-burgundy" />
      {label}
    </div>
  );
}

/** Neutral placeholder bar for skeleton states. */
export function SkeletonBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block h-4 animate-pulse rounded-[2px] bg-sand/50", className)}
    />
  );
}
