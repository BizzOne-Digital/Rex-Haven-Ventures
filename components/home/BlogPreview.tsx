import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextLink } from "@/components/ui/TextLink";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { getFeatured } from "@/lib/blog-source";

/**
 * Homepage insights preview.
 *
 * Reads through `lib/blog-source` so it shows published database posts, with
 * the built-in content as the fallback — the same source the blog index uses.
 */
export async function BlogPreview() {
  const { rest } = await getFeatured();
  const articles = rest.slice(0, 3);

  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Insights & Perspectives"
            title="Thinking worth sharing."
            description="Notes on investing, building, and partnership — how we see the work of turning opportunity into lasting value."
            className="max-w-2xl"
          />
          <div className="hidden shrink-0 md:block">
            <TextLink href="/blog">Read all insights</TextLink>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <ArticleCard key={article.slug} article={article} delay={i * 80} />
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <TextLink href="/blog">Read all insights</TextLink>
        </div>
      </Container>
    </section>
  );
}
