import { cn } from "@/lib/cn";

/**
 * TEMPORARY BRAND WORDMARK.
 *
 * The client will supply a real logo. To swap it in, replace the emblem block
 * below with a <next/image> pointing at the uploaded asset (e.g. /logo.svg) and
 * keep the sizing wrapper. Nothing else in the app references the mark directly.
 */
export function Logo({
  tone = "ink",
  className,
  emblemOnly = false,
}: {
  tone?: "ink" | "light";
  className?: string;
  emblemOnly?: boolean;
}) {
  const color = tone === "light" ? "text-cream" : "text-ink";

  return (
    <span className={cn("inline-flex items-center gap-3", color, className)}>
      <span
        aria-hidden
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[3px] border",
          tone === "light" ? "border-cream/35" : "border-burgundy/30",
        )}
      >
        {/* Arch / "haven" emblem — a gateway motif echoed in the hero. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn("h-[1.35rem] w-[1.35rem]", tone === "light" ? "text-cream" : "text-burgundy")}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 21V11a7 7 0 0 1 14 0v10" />
          <path d="M3 21h18" />
          <path d="M12 21v-6" />
        </svg>
      </span>
      {!emblemOnly && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.2rem] font-medium tracking-tight">
            Rex Haven
          </span>
          <span className="mt-[3px] text-[0.58rem] font-semibold uppercase tracking-[0.34em] opacity-70">
            Ventures
          </span>
        </span>
      )}
    </span>
  );
}
