# Rex Haven Ventures

A premium corporate lead-generation website for **Rex Haven Ventures**, an investment and
entrepreneurship firm. Editorial, executive, and conversion-focused — every page guides the
visitor toward starting a conversation.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4**.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack)         |
| `npm run build` | Production build                         |
| `npm run start` | Serve the production build               |
| `npm run lint`  | Run ESLint                               |

---

## Project structure

```
app/
  layout.tsx            Root layout: fonts, metadata, header/footer, skip link
  page.tsx              Home
  about/                About
  services/             Services
  blog/                 Blog index + [slug] article pages
  contact/              Contact (form)
  api/contact/route.ts  Contact form submission endpoint
  sitemap.ts robots.ts  SEO
  opengraph-image.tsx   Social share image
  not-found.tsx         404
components/
  layout/               Header, Footer
  ui/                   Button, Container, Eyebrow, SectionHeading, PageHero,
                        CTASection, TextLink, Logo, Reveal, Icons
  home/                 Homepage sections
  cards/                ServiceCard, ArticleCard, FeaturedArticle
  services/ blog/ contact/   Section-specific components
lib/                    site config, services, articles, philosophy, validation, cn
services/contact.ts     Client-side submission helper
```

---

## Customization

### Logo
The logo is a temporary text wordmark in [`components/ui/Logo.tsx`](components/ui/Logo.tsx).
When the client supplies a real logo, replace the emblem block with a `next/image` pointing at
the uploaded asset (e.g. `/logo.svg`) — nothing else references the mark directly.

### Brand colors & type
All design tokens live in [`app/globals.css`](app/globals.css) under `@theme` (burgundy + beige
palette, serif/sans fonts, shadows, easing). Change them in one place.

### Business info
Name, contact email, phone, and tagline are in [`lib/site.ts`](lib/site.ts).

### Services & philosophy
Edit [`lib/services.ts`](lib/services.ts) and [`lib/philosophy.ts`](lib/philosophy.ts).

### Blog content
Articles live in [`lib/articles.ts`](lib/articles.ts). The current articles are **clearly-labelled
demo content** (`CONTENT_IS_DEMO = true`) — illustrative perspective pieces that make no factual
claims. Replace them with real content, or point the module at a CMS/MDX source. Set
`CONTENT_IS_DEMO = false` to hide the demo notices.

---

## Contact form & email delivery

The form is **honest about delivery** — it never fakes a successful send.

- **No provider configured** (default): submissions validate, then the UI invites the visitor to
  reach out directly via the displayed email/phone. Nothing is silently dropped or faked.
- **Provider configured**: submissions are delivered for real.

To enable delivery, copy `.env.example` → `.env.local` and configure **one** option:

- **Resend** — `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (from a verified domain).
- **Webhook** — `CONTACT_WEBHOOK_URL` (Zapier/Make/n8n/etc.); the JSON payload is POSTed there.

Validation rules are shared between client and server via
[`lib/contact-validation.ts`](lib/contact-validation.ts), and a hidden honeypot field deters bots.
No secrets are ever committed or exposed to the client.

---

## Accessibility & SEO

- Semantic landmarks, one `<h1>` per page, labeled form fields with `aria-invalid`/`aria-describedby`,
  visible focus states, and a "skip to content" link.
- Scroll-reveal animation is progressive enhancement and fully respects `prefers-reduced-motion`;
  content is always visible without JS.
- Per-page titles/descriptions, canonical URLs, Open Graph metadata, `sitemap.xml`, and `robots.txt`.

---

## Deployment

Deploy to any Node host or [Vercel](https://vercel.com). Set `NEXT_PUBLIC_SITE_URL` and (optionally)
the contact-form env vars in your host's dashboard. Update `siteConfig.url` in
[`lib/site.ts`](lib/site.ts) to the production domain so canonical/OG URLs are correct.

---

_Note: blog articles and abstract cover art are placeholder demo material. No statistics, track
record, team members, or client claims are fabricated anywhere in this site._
