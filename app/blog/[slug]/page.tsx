import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleCover } from "@/components/blog/ArticleCover";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { CTASection } from "@/components/ui/CTASection";
import { ArrowRight, Clock } from "@/components/ui/Icons";
import {
  articles,
  getArticle,
  getRelatedArticles,
  formatArticleDate,
  CONTENT_IS_DEMO,
  type ContentBlock,
} from "@/lib/articles";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `${siteConfig.url}/blog/${article.slug}`,
      publishedTime: article.date,
      authors: [article.author],
      section: article.category,
    },
  };
}

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

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelatedArticles(slug, 3);

  return (
    <>
      <article>
        {/* Header */}
        <header className="relative bg-cream pt-32 md:pt-40">
          <Container size="default">
            <Reveal>
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-burgundy"
              >
                <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                All insights
              </Link>
            </Reveal>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold uppercase tracking-[0.14em] text-burgundy">
                {article.category}
              </span>
              {CONTENT_IS_DEMO && (
                <span className="rounded-full border border-line px-2.5 py-0.5 font-medium text-muted">
                  Demo content
                </span>
              )}
            </div>

            <Reveal as="h1" delay={60} className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-ink md:text-[3.25rem]">
              {article.title}
            </Reveal>

            <Reveal delay={140} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span>By {article.author}</span>
              <span aria-hidden className="text-line-dark">&middot;</span>
              <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
              <span aria-hidden className="text-line-dark">&middot;</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {article.readingMinutes} min read
              </span>
            </Reveal>
          </Container>
        </header>

        {/* Cover */}
        <Container size="default" className="mt-12">
          <Reveal className="overflow-hidden rounded-[6px] shadow-soft">
            <div className="aspect-[21/9] w-full">
              <ArticleCover
                cover={article.cover}
                image={article.coverImage}
                alt={article.title}
              />
            </div>
          </Reveal>
        </Container>

        {/* Body */}
        <div className="bg-cream py-16 md:py-20">
          <Container size="narrow">
            <div className="text-pretty">
              {article.content.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>

            {CONTENT_IS_DEMO && (
              <p className="mt-16 rounded-[4px] border border-line bg-beige-light/70 p-5 text-sm leading-relaxed text-muted">
                This article is illustrative placeholder content created to demonstrate the
                blog. It reflects general perspective only and is not investment advice or a
                factual claim about Rex Haven Ventures.
              </p>
            )}
          </Container>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-line bg-beige-light py-20 md:py-28">
          <Container size="wide">
            <h2 className="font-serif text-2xl text-ink md:text-3xl">Keep reading</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <ArticleCard key={r.slug} article={r} delay={(i % 3) * 70} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <CTASection
        eyebrow="Get in Touch"
        title="Let's turn perspective into partnership."
        description="If these ideas resonate with what you're building or looking for, we'd love to talk."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "Explore Our Services", href: "/services" }}
      />
    </>
  );
}
