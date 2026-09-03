import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { siteConfig } from "@/lib/site";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const title = `${siteConfig.name} | ${siteConfig.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Rex Haven Ventures",
    "investment firm",
    "venture building",
    "entrepreneurship",
    "strategic growth",
    "business partnerships",
    "private investment",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * Document shell.
 *
 * Deliberately chrome-free: the site header and footer live in
 * `app/(site)/layout.tsx`, and the admin dashboard supplies its own shell in
 * `app/admin/(dashboard)/layout.tsx`. Keeping them out of here is what lets the
 * dashboard render as a full-height application rather than a page bolted into
 * the marketing site.
 */

// Progressive enhancement: mark JS available before paint so scroll-reveal's
// hidden initial state only applies when JS can un-hide it. See globals.css.
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: some browser extensions (e.g. Grammarly)
          inject attributes onto <body> before hydration. This suppresses only
          this element's own attribute diff, not the component tree below it. */}
      <body className="min-h-full bg-cream" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
        {/* SessionProvider resolves the signed-in member on the client, so the
            static marketing pages below stay statically rendered. Authorization
            is always re-checked on the server. */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
