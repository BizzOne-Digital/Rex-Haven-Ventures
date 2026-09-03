import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Empty state, styled after the "No matching insights" panel in
 * `components/blog/BlogIndex.tsx` so it reads as part of the same site.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-line bg-beige-light/60 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-burgundy-tint text-burgundy">
          {icon}
        </span>
      )}
      <p className="font-serif text-xl text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
