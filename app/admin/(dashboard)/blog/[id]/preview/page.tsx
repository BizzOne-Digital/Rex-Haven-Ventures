import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusPill, statusTone } from "@/components/ui/StatusPill";
import { ArticleCover } from "@/components/blog/ArticleCover";
import { ArrowRight, Clock, Pencil } from "@/components/ui/Icons";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { postToArticle } from "@/lib/blog-source";
import { formatArticleDate, type Article, type ContentBlock } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

/**
 * Draft preview.
 *
 * Renders a post exactly as the public article page does — the same cover, type
 * scale, and content-block markup — so what an administrator approves is what
 * readers get. Drafts are included, which is the whole point, and is why this
 * page re-checks the admin role rather than trusting the parent layout alone.
 *
 * The member discussion section is deliberately absent: it belongs to a
 * published article, and a draft has no public feedback to show.
 */

/**
 * Copy of the public article's block renderer.
 *
 * Duplicated rather than shared on purpose: the public renderer lives inside a
 * statically-generated route, and importing this admin-only page's tree into it
 * (or vice versa) would couple a private screen to a public one. Both are ~20
 * lines and change together rarely.
 */
function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className="mt-14 font-serif text-3xl text-ink">{block.text}</h2>;
    case "quote":
      return (
        <blockquote className="my-12 border-l-2 border-burgundy py-1 pl-7">
          <p className="font-serif text-2xl italic leading-snug text-ink md:text-[1.75rem]">
            {block.text}
          </p>
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-6 flex flex-col gap-3">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-burgundy" />
              <span className="text-lg leading-relaxed text-charcoal/85">{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return <p className="mt-6 text-lg leading-relaxed text-charcoal/85">{block.text}</p>;
  }
}

export default async function AdminPostPreviewPage({
  params,
}: PageProps<"/admin/blog/[id]/preview">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/login");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  // `.lean()` keeps this a plain object — see the note in the editor page.
  let loaded: { article: Article; status: string } | null = null;

  try {
    await connectToDatabase();
    const post = await BlogPost.findById(id).lean<BlogPostDocument | null>();
    if (post) loaded = { article: postToArticle(post), status: post.status };
  } catch {
    return (
      <Alert tone="error" title="We couldn't load this post">
        The database is unreachable right now. Please try again in a moment.
      </Alert>
    );
  }

  if (!loaded) notFound();

  const { article, status } = loaded;

  return (
    <div>
      {/* Preview chrome — clearly not part of the article itself */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-burgundy/25 bg-burgundy-tint/40 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={statusTone(status)}>
            {status === "published" ? "Published" : "Draft"}
          </StatusPill>
          <p className="text-sm text-burgundy-deep">
            {status === "published"
              ? "This is how the article appears on the public blog."
              : "Draft preview — this is not visible to the public yet."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/admin/blog/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Back to editing
          </Link>
          {status === "published" && (
            <Button href={`/blog/${article.slug}`} variant="outline">
              Open live page
            </Button>
          )}
        </div>
      </div>

      {/* Article, rendered as the public page does */}
      <article className="mt-8 overflow-hidden rounded-[6px] border border-line bg-cream">
        <header className="pt-12">
          <Container size="default">
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-[0.14em] text-burgundy">
                {article.category}
              </span>
            </span>

            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-ink md:text-[3.25rem]">
              {article.title}
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span>By {article.author}</span>
              <span aria-hidden className="text-line-dark">
                &middot;
              </span>
              <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
              <span aria-hidden className="text-line-dark">
                &middot;
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {article.readingMinutes} min read
              </span>
            </div>

            {article.tags && article.tags.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </header>

        <Container size="default" className="mt-10">
          <div className="overflow-hidden rounded-[6px] shadow-soft">
            <div className="aspect-[21/9] w-full">
              <ArticleCover
                cover={article.cover}
                image={article.coverImage}
                alt={article.title}
              />
            </div>
          </div>
        </Container>

        <div className="py-12">
          <Container size="narrow">
            {article.content.length === 0 ? (
              <Alert tone="warning" title="This post has no body yet">
                Add some content in the editor and it will appear here.
              </Alert>
            ) : (
              <div className="text-pretty">
                {article.content.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            )}
          </Container>
        </div>
      </article>

      {/* Excerpt + SEO, as search engines and cards would use them */}
      <section className="mt-8 rounded-[6px] border border-line bg-beige-light/50 p-6">
        <h2 className="font-serif text-lg text-ink">How this appears elsewhere</h2>
        <dl className="mt-4 flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">
              Card / index excerpt
            </dt>
            <dd className="mt-1.5 leading-relaxed text-charcoal">{article.excerpt}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">Search title</dt>
            <dd className="mt-1.5 text-charcoal">{article.seoTitle || article.title}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-muted">
              Search description
            </dt>
            <dd className="mt-1.5 leading-relaxed text-charcoal">
              {article.seoDescription || article.excerpt}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs text-muted">
          Public URL: <code className="font-mono">/blog/{article.slug}</code>
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/admin/blog"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy"
        >
          <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
          All posts
        </Link>
      </div>
    </div>
  );
}
