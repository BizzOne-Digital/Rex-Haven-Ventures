import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangle, Check, Info } from "@/components/ui/Icons";

/**
 * Inline status message.
 *
 * Colour alone never carries the meaning: each tone pairs with its own icon and
 * the appropriate ARIA role, so the message reaches screen readers and users
 * who can't distinguish the palette.
 */

type Tone = "error" | "success" | "info" | "warning";

const tones: Record<Tone, { wrapper: string; icon: string }> = {
  error: { wrapper: "border-danger/30 bg-danger/[0.04] text-danger", icon: "text-danger" },
  success: { wrapper: "border-success/30 bg-success/[0.05] text-success", icon: "text-success" },
  info: { wrapper: "border-line bg-beige-light/70 text-charcoal", icon: "text-burgundy" },
  warning: {
    wrapper: "border-burgundy/25 bg-burgundy-tint/50 text-burgundy-deep",
    icon: "text-burgundy",
  },
};

const icons: Record<Tone, typeof Info> = {
  error: AlertTriangle,
  success: Check,
  info: Info,
  warning: AlertTriangle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  action,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const IconCmp = icons[tone];
  return (
    <div
      // Errors interrupt; everything else is announced politely.
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-[4px] border p-4 text-sm leading-relaxed",
        tones[tone].wrapper,
        className,
      )}
    >
      <IconCmp className={cn("mt-0.5 h-4 w-4 shrink-0", tones[tone].icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className={cn(Boolean(title) && "mt-1", "text-current/85")}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
