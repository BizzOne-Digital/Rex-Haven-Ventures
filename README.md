# Rex Haven Ventures

A premium corporate lead-generation website for **Rex Haven Ventures**, an investment and
entrepreneurship firm. Editorial, executive, and conversion-focused — every page guides the
visitor toward starting a conversation.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · MongoDB (Mongoose)**.

Alongside the marketing site there is a **member area** — visitors can create an account and
contribute feedback and insights on published articles — and an **admin dashboard** for
moderating those contributions and managing the blog and user accounts.

---

## Getting started

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The site runs **without** any configuration: with no `MONGODB_URI` the blog serves the built-in
articles from `lib/articles.ts` and the member/admin features report that they aren't configured
yet. Nothing breaks, and nothing pretends to work.

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
  login/ signup/        Member authentication
  account/              Member account + contribution history (server-guarded)
  admin/
    login/              Administrator sign-in (outside the guarded group)
    (dashboard)/        Guarded admin area — layout.tsx is the server-side gate
      page.tsx          Dashboard: metrics + recent activity
      feedback/         Moderation queue
      blog/             Post list, new-post editor, [id] editor, [id]/preview
      categories/       Category management
      users/            Member list and [id] detail
      media/            Image library
      profile/          Admin profile, password change, sign-out
  api/
    contact/            Contact form submission endpoint
    auth/               signup · login · logout · me
    blog/posts/         Public read-only blog API
    categories/         Public list; create/update/delete are admin-guarded
    feedback/           Submit · approved list · mine · [id] (owner edit/withdraw)
    admin/              dashboard · stats · users · posts · feedback ·
                        categories · media · profile · seed  (all admin-guarded)
  sitemap.ts robots.ts  SEO
  opengraph-image.tsx   Social share image
  not-found.tsx         404
components/
  layout/               Header, Footer
  ui/                   Button, Container, Eyebrow, SectionHeading, PageHero,
                        CTASection, TextLink, Logo, Reveal, Icons,
                        Field, Alert, Spinner, EmptyState, StatusPill
  home/                 Homepage sections
  cards/                ServiceCard, ArticleCard, FeaturedArticle
  auth/                 SessionProvider, AccountMenu, AuthShell, Login/Signup forms
  account/              MySubmissions
  admin/                AdminNav (sidebar), AdminDashboard, RecentActivity,
                        ModerationQueue, PostManager, PostEditor,
                        CategoryManager, MediaLibrary, UserManager,
                        AdminProfile, StatCard
  services/ blog/ contact/   Section-specific components
lib/
  site.ts services.ts articles.ts philosophy.ts cn.ts     (pre-existing)
  db/mongoose.ts        Cached connection
  db/models/            User · BlogPost · Feedback · Category · Media
                        schemas and indexes
  auth/                 session (JWT cookie) · password (bcrypt) · admin-seed
  blog-source.ts        Blog reads: MongoDB, falling back to lib/articles.ts
  category-source.ts    Category reads, with the same fallback
  media.ts              Upload storage + dependency-free image-header parsing
  api.ts api-response.ts   Route-handler helpers and authorization guards
  *-validation.ts       Rules shared by client forms and server routes
  sanitize.ts           Strips markup from submitted content
services/
  contact.ts            Client-side submission helper (pre-existing)
  api-client.ts         Shared fetch wrapper returning explicit results
  auth.ts feedback.ts admin.ts   Client-side API calls
  categories.ts media.ts         Category and media calls
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
The blog reads through [`lib/blog-source.ts`](lib/blog-source.ts), which resolves content in this
order:

1. **Published posts in MongoDB** — managed from the admin dashboard.
2. **The built-in articles** in [`lib/articles.ts`](lib/articles.ts) — used when the database is
   unconfigured, unreachable, or has no published posts yet.

That fallback is deliberate: the public blog keeps working exactly as it did before the database
existed. While it is in use, the demo-content notices are shown automatically.

To move the built-in articles under database management, sign in as an administrator and use
**Import built-in articles** on the Blog screen. The import is idempotent — existing slugs are
skipped, never overwritten — so it's safe to run again after adding a new article to
`lib/articles.ts`.

Article bodies are authored as plain text with a small set of conventions, parsed into the same
content blocks the built-in articles use:

| Line starts with | Renders as   |
| ---------------- | ------------ |
| `## `            | Heading      |
| `> `             | Pull quote   |
| `- ` or `* `     | List item    |
| anything else    | Paragraph    |

Blank lines separate paragraphs. Editing a post round-trips this format losslessly.

---

## Environment variables

Copy `.env.example` → `.env.local` and fill it in. Every `.env*` file is git-ignored except the
example itself.

| Variable              | Required | Purpose                                                        |
| --------------------- | -------- | -------------------------------------------------------------- |
| `MONGODB_URI`         | Yes      | MongoDB connection string. Server-side only — never exposed to the browser. |
| `AUTH_SECRET`         | Yes      | Signs the session cookie (HS256). **32+ characters.** Generate with `openssl rand -base64 32`. Rotating it invalidates all sessions. |
| `ADMIN_EMAIL`         | Yes      | Administrator account to seed.                                 |
| `ADMIN_PASSWORD`      | Yes      | Administrator password. Hashed with bcrypt before storage — the plain value never reaches the database. |
| `NEXT_PUBLIC_APP_URL` | Yes      | Absolute base URL of the deployment.                           |
| `SESSION_MAX_AGE_DAYS`| No       | How long members stay signed in. Default `7`.                  |
| `ADMIN_NAME`          | No       | Display name for the seeded admin. Default `Administrator`.    |
| `NEXT_PUBLIC_SITE_URL`| No       | Pre-existing; canonical URL for SEO metadata.                  |
| Contact-form vars     | No       | See [Contact form & email delivery](#contact-form--email-delivery). |
| Media storage vars    | No       | Only for serverless hosts — see [Media](#media). Local uploads need nothing. |

### First run

1. Set the variables above and start the server.
2. Go to **`/admin/login`** and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
   The administrator is created in MongoDB on that first attempt — there are **no hard-coded
   credentials anywhere in the source**.
3. On the Blog screen, click **Import built-in articles**. This also creates the four default
   categories. It is idempotent, so it is safe to run again later.

Changing `ADMIN_PASSWORD` later re-hashes and re-syncs it on the next successful sign-in, so the
environment file stays the source of truth for that account.

---

## Members, moderation & the admin dashboard

### Members
Visitors sign up with name, email and password, stay signed in across refreshes, and can offer
**feedback** or share **insights** on any published article. Their own contributions — with
moderation status — are listed at `/account`, where a pending item can still be edited or
withdrawn.

### Moderation
Nothing a member submits becomes public on its own:

```
member submits -> saved with status "pending" -> admin reviews -> approved | rejected
                                                                     |
                                                     only "approved" is shown publicly
```

A rejection can carry a short note, which the member sees on their account page. Reversing an
approval takes the contribution straight back off the article.

### Admin dashboard (`/admin`)

A sidebar (a scrollable strip on mobile) covers:

- **Dashboard** — blog posts (total / published / draft), registered members, and pending /
  approved / rejected contributions, plus category and media counts. Below that, recent activity:
  recently published posts, latest submissions, newest members.
- **Blog Posts** — searchable, filterable by status and category, sortable by date. Edit,
  preview, publish/unpublish, or delete (with confirmation) from the list.
- **Create Blog** — the post editor. Title, slug (auto-derived from the title until you edit it),
  excerpt, body, category, tags, publication date, reading time (with an estimate button),
  author, cover art or featured image, featured flag, draft/published status, and SEO title and
  description.
- **Categories** — create, rename, reorder and delete. See how many posts use each one.
- **Members** — search and filter accounts; open a member to see their full contribution history.
  Activate/deactivate, change role, or delete.
- **Feedback & Insights** — the moderation queue.
- **Media** — upload, browse and delete images; pick one as a post's featured image.
- **Profile & Settings** — administrator email, display name, password change, sign out.

### Preview

Every post has a preview at `/admin/blog/<id>/preview`, reachable from the editor and the post
list. It renders the article exactly as the public page does — same cover, type scale and content
blocks — and shows how the excerpt and SEO fields will read elsewhere. Drafts are previewable and
clearly labelled as not yet public.

### Categories

Categories live in their own collection and drive the filter row on the public blog. Posts
reference a category **by name**, which keeps `BlogPost.category` a plain string so the existing
article components render it unchanged, and means a post survives its category being removed.

Two operations are handled carefully as a result:

- **Renaming** rewrites the name on every post that used it, in the same request. The editor
  shows the affected count before you save.
- **Deleting** a category that is still in use requires choosing which category its posts move
  to. The last remaining category cannot be deleted.

### Media

Uploads are written to `public/uploads` and indexed in a `Media` collection — no third-party
service, no credentials, works on any Node host. Images are capped at 5 MB; dimensions are read
straight from the file header (PNG, JPEG, GIF, WebP) without an image library. Deleting an image
that a post still uses requires confirmation, and clears the reference so no post is left
pointing at a missing file.

**This does not survive a serverless deploy.** On Vercel or Netlify Functions the filesystem is
ephemeral, so uploads vanish on the next build. `.env.example` documents the Cloudinary and
S3-compatible variables you would need, and [`lib/media.ts`](lib/media.ts) marks the two functions
to replace. Nothing is required until you actually switch.

### Administrator password

The environment **seeds** the admin account; it does not own it afterwards. `ADMIN_EMAIL` /
`ADMIN_PASSWORD` create the account on the first sign-in attempt, and an existing account's
password is never overwritten — otherwise a password changed in Profile & Settings would silently
revert on the next sign-in. To reset a forgotten admin password, delete that user document or
point `ADMIN_EMAIL` at a new address and sign in again.

---

## API

Public:

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/api/blog/posts` | Published articles (summaries) |
| `GET` | `/api/blog/posts/:slug` | One published article, with body |
| `GET` | `/api/categories` | Category names |
| `GET` | `/api/feedback?postSlug=` | **Approved** submissions only |
| `POST` | `/api/contact` | Pre-existing contact form |

Authentication:

| Method | Path |
| ------ | ---- |
| `POST` | `/api/auth/signup` |
| `POST` | `/api/auth/login` |
| `POST` | `/api/auth/logout` |
| `GET` | `/api/auth/me` |

Members (signed in):

| Method | Path | Notes |
| ------ | ---- | ----- |
| `POST` | `/api/feedback` | Submit; always saved as `pending` |
| `GET` | `/api/feedback/mine` | Own submissions, any status |
| `PATCH` | `/api/feedback/:id` | Edit — only while `pending` |
| `DELETE` | `/api/feedback/:id` | Withdraw |

Admin (all `requireAdmin`):

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/api/admin/dashboard` | Counters + recent activity |
| `GET` | `/api/admin/stats` | Counters only |
| `GET` | `/api/admin/posts` | Drafts included |
| `POST` | `/api/admin/posts` | Create |
| `GET`/`PATCH`/`DELETE` | `/api/admin/posts/:id` | `PATCH` accepts a full payload or just `{ status }` |
| `POST` | `/api/categories` | Create |
| `PATCH`/`DELETE` | `/api/categories/:id` | Rename cascades; delete needs `reassignTo` when in use |
| `GET` | `/api/admin/feedback` | Moderation queue, filterable |
| `PATCH`/`DELETE` | `/api/admin/feedback/:id` | `{ status }` approves / rejects / requeues |
| `GET` | `/api/admin/users` | Searchable, paginated |
| `GET`/`PATCH`/`DELETE` | `/api/admin/users/:id` | Self-protection enforced |
| `GET`/`POST` | `/api/admin/media` | List / upload (multipart) |
| `PATCH`/`DELETE` | `/api/admin/media/:id` | Alt text / delete |
| `GET`/`PATCH` | `/api/admin/profile` | Own name and password |
| `POST` | `/api/admin/seed` | Import built-in articles and default categories |

Approve and reject share one endpoint (`PATCH .../feedback/:id` with a `status`) rather than
separate `/approve` and `/reject` routes: it is a single state transition, and one handler means
one place where the article's cache is revalidated.

---

## Security

- **Passwords** are bcrypt-hashed (cost 12). The `passwordHash` field is `select: false` on the
  schema, so it is excluded from queries unless explicitly requested — it cannot reach an API
  response by accident.
- **Sessions** are signed JWTs in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in production).
  The payload holds only an account id and role; the account is re-read from the database on every
  authenticated request, so deactivating or deleting a user takes effect immediately.
- **Authorization is always server-side.** `requireUser` / `requireAdmin` in
  [`lib/api.ts`](lib/api.ts) return either the caller's account or a ready-to-return response, so a
  handler cannot continue past a failed check. The admin UI is additionally gated by a server
  component, and page guards never rely on the client.
- **Ownership** is enforced in the query filter (`author: <session id>`), not by fetching and
  comparing — a non-owner gets `404`, indistinguishable from a record that doesn't exist.
- **Privilege escalation** is impossible from the client: signup always creates a `member`, and a
  submitted `status` is ignored in favour of `pending`.
- **Submitted content** is stripped of markup before storage and rendered as plain text nodes.
- **Sign-in** is uniform on failure and pays a bcrypt cost even for unknown emails, so response
  timing doesn't reveal which addresses are registered. Credential endpoints are rate-limited.
- **Search input** is escaped before becoming a regular expression.
- **The public feedback query pins `status: "approved"`** in the filter rather than filtering
  afterwards, and the public projection never reads the author's email address.
- **Deactivated members cannot contribute.** `getCurrentUser` returns `null` for an inactive
  account, so their session stops working immediately — no separate check to forget.
- **Uploads are constrained** by MIME type and size, and the stored filename is generated rather
  than taken from the client, so a crafted name cannot escape the upload directory. Deletion
  re-verifies the resolved path is still inside it.
- **Changing the admin password requires the current one**, even though the caller is already
  authenticated, so a borrowed session cannot lock the owner out.

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

Deploy to any Node host or [Vercel](https://vercel.com). Set every **required** variable from
[Environment variables](#environment-variables) in your host's dashboard — plus
`NEXT_PUBLIC_SITE_URL` and, optionally, the contact-form vars. Update `siteConfig.url` in
[`lib/site.ts`](lib/site.ts) to the production domain so canonical/OG URLs are correct.

Two notes for production:

- Use a **fresh `AUTH_SECRET`**, not the one from local development.
- The in-process rate limiter in [`lib/rate-limit.ts`](lib/rate-limit.ts) is per-instance. Behind
  more than one instance, add an edge/WAF rate limit or swap its backing store for Redis.

### Rendering

The marketing site stays **statically rendered** — the session is resolved on the client so that
reading cookies never forces `/`, `/about`, `/services`, `/contact` or `/blog` into dynamic
rendering. Article pages are prerendered for every slug; admin mutations call `revalidatePath` so
edits appear without a redeploy. Only the member area, the admin dashboard and the API routes are
server-rendered on demand.

---

_Note: the built-in blog articles and abstract cover art are placeholder demo material. No
statistics, track record, team members, or client claims are fabricated anywhere in this site._
