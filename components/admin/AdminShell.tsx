"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useSession } from "@/components/auth/SessionProvider";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import {
  ArrowUpRight,
  Close,
  FileText,
  Gauge,
  Image as ImageIcon,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Users,
} from "@/components/ui/Icons";

/**
 * Admin dashboard shell.
 *
 * Two independent panels rather than a page sitting inside the marketing site:
 *
 *   - The rail is `position: fixed`, so it stays put while the content scrolls.
 *     Its nav list is the only scrollable part of it, which keeps the brand and
 *     the sign-out block reachable however long that list grows.
 *   - The content column is offset past the rail's width and carries matching
 *     padding, so the two read as separate surfaces with a gap between them.
 *
 * Below `lg` the rail becomes an off-canvas drawer opened from the topbar — the
 * site's own mobile menu is no longer present here to compete with it.
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

/** Longest match wins, so /admin/blog/new doesn't read as "Blog Posts". */
function currentTitle(pathname: string): string {
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}

export function AdminShell({
  user,
  pendingCount,
  children,
}: {
  user: { name: string; email: string };
  pendingCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const isActive = (item: Item) => {
    if (item.href === "/admin") return pathname === "/admin";
    // "Create Blog" is a sibling of "Blog Posts"; the more specific path wins.
    if (item.href === "/admin/blog/new") return pathname === "/admin/blog/new";
    if (item.href === "/admin/blog") {
      return pathname.startsWith("/admin/blog") && pathname !== "/admin/blog/new";
    }
    return item.nested ? pathname.startsWith(item.href) : pathname === item.href;
  };

  const badgeFor = (item: Item) =>
    item.href === "/admin/feedback" && (pendingCount ?? 0) > 0 ? pendingCount : null;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  return (
    <div className="min-h-screen bg-beige-light">
      {/* Drawer scrim. Kept mounted so it fades rather than snaps. */}
      <div
        aria-hidden
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Fixed rail. `inset-y-0` plus `p-3` is what produces the gap to the
          content column, which adds matching padding of its own. */}
      <aside
        id="admin-rail"
        aria-label="Admin sections"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] p-3 transition-transform duration-300 ease-out lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-line bg-cream shadow-lift">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-4">
            <Link
              href="/admin"
              onClick={() => setDrawerOpen(false)}
              className="rounded-sm"
            >
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[3px] text-muted transition-colors hover:bg-beige-light hover:text-burgundy lg:hidden"
            >
              <Close className="h-4 w-4" />
              <span className="sr-only">Close the menu</span>
            </button>
          </div>

          {/* The only scrollable region in the rail. */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-muted/80">
              Manage
            </p>
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
                      // Closed here rather than in an effect on `pathname`, so
                      // the drawer never covers the page it just opened.
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-[4px] border-l-2 py-2.5 pl-3.5 pr-3 text-sm font-medium transition-colors duration-300",
                        active
                          ? "border-burgundy bg-burgundy-tint/50 text-burgundy-deep"
                          : "border-transparent text-muted hover:border-burgundy/30 hover:bg-beige-light/70 hover:text-burgundy",
                      )}
                    >
                      <IconCmp
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-burgundy" : "text-muted group-hover:text-burgundy",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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
          </nav>

          <div className="border-t border-line px-3 py-3">
            <div className="flex items-center gap-2.5 px-1 pb-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-burgundy-tint text-[0.7rem] font-semibold text-burgundy-deep"
              >
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-[4px] border-l-2 border-transparent py-2.5 pl-3.5 pr-3 text-left text-sm font-medium text-muted transition-colors hover:bg-beige-light/70 hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-60"
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
      </aside>

      {/* Content column, offset past the rail. */}
      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/70 bg-beige-light/90 px-3 py-3 backdrop-blur-sm sm:px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="admin-rail"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[4px] border border-line bg-cream text-charcoal transition-colors hover:text-burgundy lg:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open the admin menu</span>
          </button>

          <div className="min-w-0">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-muted/80">
              Administration
            </p>
            <h1 className="truncate font-serif text-lg text-ink md:text-xl">
              {currentTitle(pathname)}
            </h1>
          </div>

          <Link
            href="/"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-line bg-cream px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-burgundy/30 hover:text-burgundy"
          >
            View site
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        <main className="p-3 sm:p-4">
          <div className="min-w-0 rounded-[6px] border border-line bg-cream p-5 shadow-soft sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
