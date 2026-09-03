"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useSession } from "@/components/auth/SessionProvider";
import { Spinner } from "@/components/ui/Spinner";
import {
  FileText,
  Gauge,
  Image as ImageIcon,
  Layers,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "@/components/ui/Icons";

/**
 * Admin sidebar.
 *
 * A vertical rail on desktop; on tablet and mobile it becomes a horizontally
 * scrollable strip so the dashboard never needs a second drawer competing with
 * the site's own mobile menu.
 *
 * Sign-out clears the session cookie server-side, then returns to the public
 * site — an admin should not be left staring at a guarded page.
 */

type Item = {
  href: string;
  label: string;
  icon: typeof Gauge;
  /** Matches nested routes (e.g. /admin/blog/new) rather than only the exact path. */
  nested?: boolean;
};

const items: Item[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/blog", label: "Blog Posts", icon: FileText, nested: true },
  { href: "/admin/blog/new", label: "Create Blog", icon: Plus },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/users", label: "Members", icon: Users, nested: true },
  { href: "/admin/feedback", label: "Feedback & Insights", icon: MessageSquare },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/profile", label: "Profile & Settings", icon: Settings },
];

export function AdminNav({ pendingCount }: { pendingCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (item: Item) => {
    if (item.href === "/admin") return pathname === "/admin";
    // "Create Blog" is a sibling of "Blog Posts"; the more specific path wins.
    if (item.href === "/admin/blog/new") return pathname === "/admin/blog/new";
    if (item.href === "/admin/blog") {
      return pathname.startsWith("/admin/blog") && pathname !== "/admin/blog/new";
    }
    return item.nested ? pathname.startsWith(item.href) : pathname === item.href;
  };

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const badgeFor = (item: Item) =>
    item.href === "/admin/feedback" && (pendingCount ?? 0) > 0 ? pendingCount : null;

  return (
    <nav aria-label="Admin sections" className="lg:sticky lg:top-28">
      {/* Mobile / tablet: horizontal strip.
          The scroll container and the `min-w-max` content must be different
          elements — putting both on one element makes it grow to fit instead of
          scrolling, which pushes the whole page into horizontal overflow. */}
      <div className="-mx-6 overflow-x-auto border-b border-line px-6 sm:-mx-8 sm:px-8 lg:hidden">
      <ul className="flex min-w-max items-center gap-1 pb-px">
        {items.map((item) => {
          const active = isActive(item);
          const IconCmp = item.icon;
          const badge = badgeFor(item);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors duration-300",
                  active
                    ? "border-burgundy text-burgundy"
                    : "border-transparent text-muted hover:border-burgundy/30 hover:text-burgundy",
                )}
              >
                <IconCmp className="h-4 w-4" />
                {item.label}
                {badge !== null && (
                  <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-cream">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3.5 py-3 text-sm font-medium text-muted transition-colors hover:text-burgundy disabled:opacity-60"
          >
            {signingOut ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        </li>
      </ul>
      </div>

      {/* Desktop: vertical rail */}
      <div className="hidden lg:block">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = isActive(item);
            const IconCmp = item.icon;
            const badge = badgeFor(item);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-[4px] border-l-2 py-2.5 pl-4 pr-3 text-sm font-medium transition-colors duration-300",
                    active
                      ? "border-burgundy bg-burgundy-tint/50 text-burgundy-deep"
                      : "border-transparent text-muted hover:border-burgundy/30 hover:bg-beige-light/60 hover:text-burgundy",
                  )}
                >
                  <IconCmp
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-burgundy" : "text-muted group-hover:text-burgundy",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-burgundy px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none text-cream">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-line pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-[4px] border-l-2 border-transparent py-2.5 pl-4 pr-3 text-left text-sm font-medium text-muted transition-colors hover:bg-beige-light/60 hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingOut ? (
              <Spinner className="h-4 w-4 shrink-0" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
            {signingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
}
