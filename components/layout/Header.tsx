"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { navItems, telHref, mailtoHref, siteConfig } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Close, Menu, Mail, Phone } from "@/components/ui/Icons";

function useActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };
}

export function Header() {
  const pathname = usePathname();
  const isActive = useActive();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Scroll state (rAF-throttled).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Body scroll-lock + Escape while menu open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || !isHome || open;
  const linkColorInactive = solid
    ? "text-charcoal/75 hover:text-burgundy"
    : "text-cream/80 hover:text-cream";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500",
        solid
          ? "border-b border-line/70 bg-cream/85 backdrop-blur-md supports-[backdrop-filter]:bg-cream/75"
          : "bg-transparent",
      )}
    >
      <Container size="wide">
        <div className="flex h-20 items-center justify-between gap-6">
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            className="relative z-10 -ml-1 rounded-sm py-1"
          >
            <Logo tone={solid ? "ink" : "light"} />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative text-sm font-medium tracking-wide transition-colors duration-300",
                    active ? (solid ? "text-burgundy" : "text-cream") : linkColorInactive,
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px bg-current transition-all duration-300 ease-out",
                      active
                        ? "w-full opacity-100"
                        : "w-0 opacity-0 group-hover:w-full group-hover:opacity-70",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <Button href="/contact" variant={solid ? "primary" : "light"} withArrow>
              Let&rsquo;s Talk
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={cn(
              "relative z-10 -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-sm transition-colors lg:hidden",
              solid ? "text-ink" : "text-cream",
            )}
          >
            {open ? <Close className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu overlay */}
      <div
        id="mobile-menu"
        inert={!open}
        className={cn(
          "fixed inset-0 top-0 z-40 flex flex-col bg-cream transition-[opacity,transform] duration-400 ease-out lg:hidden",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <div className="h-20 shrink-0" aria-hidden />
        <nav
          aria-label="Mobile"
          className="flex flex-1 flex-col justify-between overflow-y-auto px-6 pb-10 pt-6 sm:px-8"
        >
          <ul className="flex flex-col">
            {navItems.map((item, i) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="border-b border-line/70">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between py-5 font-serif text-3xl transition-colors",
                      active ? "text-burgundy" : "text-ink hover:text-burgundy",
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="index-num text-sm text-muted">
                      0{i + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-col gap-6">
            <Button
              href="/contact"
              variant="primary"
              size="lg"
              fullWidth
              withArrow
              onClick={() => setOpen(false)}
            >
              Start a Conversation
            </Button>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <a
                href={telHref}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-3 hover:text-burgundy"
              >
                <Phone className="h-4 w-4 text-burgundy" />
                {siteConfig.contact.phone}
              </a>
              <a
                href={mailtoHref}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-3 hover:text-burgundy"
              >
                <Mail className="h-4 w-4 text-burgundy" />
                {siteConfig.contact.email}
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
