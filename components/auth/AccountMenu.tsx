"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useSession } from "@/components/auth/SessionProvider";
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Account control in the site header.
 *
 * Two visual modes so it sits correctly on both header states: `tone="light"`
 * over the transparent hero, `tone="ink"` once the header goes solid — matching
 * how the existing nav links switch.
 */

export function AccountMenu({ tone }: { tone: "light" | "ink" }) {
  const { user, isLoading, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const inactive =
    tone === "ink" ? "text-charcoal/75 hover:text-burgundy" : "text-cream/80 hover:text-cream";

  // Reserve the slot while resolving so the header does not shift on load.
  if (isLoading) {
    return (
      <span className={cn("inline-flex h-9 items-center gap-2 text-sm", inactive)}>
        <Spinner className="h-3.5 w-3.5" />
        <span className="sr-only">Checking your sign-in status</span>
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium tracking-wide transition-colors duration-300",
          inactive,
        )}
      >
        <UserIcon className="h-4 w-4" />
        Sign in
      </Link>
    );
  }

  const firstName = user.name.split(" ")[0] || user.name;

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center gap-2 rounded-sm text-sm font-medium tracking-wide transition-colors duration-300",
          inactive,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full text-[0.7rem] font-semibold uppercase",
            tone === "ink" ? "bg-burgundy-tint text-burgundy-deep" : "bg-cream/20 text-cream",
          )}
        >
          {firstName.slice(0, 2)}
        </span>
        <span className="max-w-[7rem] truncate">{firstName}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <div
        role="menu"
        inert={!open}
        className={cn(
          "absolute right-0 top-full z-50 mt-3 w-64 origin-top-right overflow-hidden rounded-[4px] border border-line bg-cream shadow-lift transition-[opacity,transform] duration-200 ease-out",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="border-b border-line px-4 py-3">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>

        {/* Each link closes the menu itself, so navigation needs no effect. */}
        <Link
          href="/account"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-4 py-3 text-sm text-charcoal transition-colors hover:bg-beige-light hover:text-burgundy"
        >
          <UserIcon className="h-4 w-4 text-burgundy" />
          My account
        </Link>

        {user.role === "admin" && (
          <Link
            href="/admin"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-sm text-charcoal transition-colors hover:bg-beige-light hover:text-burgundy"
          >
            <ShieldCheck className="h-4 w-4 text-burgundy" />
            Admin dashboard
          </Link>
        )}

        <button
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-left text-sm text-charcoal transition-colors hover:bg-beige-light hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? (
            <Spinner className="h-4 w-4 text-burgundy" />
          ) : (
            <LogOut className="h-4 w-4 text-burgundy" />
          )}
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}

/**
 * Account block for the mobile menu — a flat list rather than a dropdown,
 * matching how the mobile nav presents everything else.
 */
export function AccountMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const { user, isLoading, signOut } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner className="h-3.5 w-3.5 text-burgundy" />
        Checking your sign-in status…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <Link
          href="/login"
          onClick={onNavigate}
          className="inline-flex items-center gap-3 font-medium text-burgundy"
        >
          <UserIcon className="h-4 w-4" />
          Sign in
        </Link>
        <Link href="/signup" onClick={onNavigate} className="text-muted hover:text-burgundy">
          Create a member account
        </Link>
      </div>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    onNavigate();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">
        Signed in as {user.name}
      </p>
      <Link
        href="/account"
        onClick={onNavigate}
        className="inline-flex items-center gap-3 font-medium text-burgundy"
      >
        <UserIcon className="h-4 w-4" />
        My account
      </Link>
      {user.role === "admin" && (
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex items-center gap-3 font-medium text-burgundy"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin dashboard
        </Link>
      )}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="inline-flex items-center gap-3 text-left text-muted transition-colors hover:text-burgundy disabled:opacity-60"
      >
        {signingOut ? <Spinner className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
