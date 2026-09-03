import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Public site shell.
 *
 * Header, footer and the skip link used to live in the root layout, which meant
 * the admin dashboard inherited them too. Scoping them to this route group is
 * what lets `/admin` render as a standalone dashboard while every marketing and
 * member page keeps the site chrome unchanged.
 *
 * This is a nested layout, not a second root layout — the `<html>`/`<body>`
 * document and `SessionProvider` still come from `app/layout.tsx`, so moving
 * between the site and the dashboard is a client-side navigation.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[3px] focus:bg-burgundy focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-cream focus:shadow-lift"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
