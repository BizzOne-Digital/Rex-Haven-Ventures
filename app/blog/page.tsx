import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { CTASection } from "@/components/ui/CTASection";
import { FeaturedArticle } from "@/components/cards/FeaturedArticle";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeatured } from "@/lib/blog-source";
import { getCategoryNames } from "@/lib/category-source";

export const metadata: Metadata = {
  title: "Insights & Perspectives",
  description:
    "Perspectives on investing, entrepreneurship, and building businesses that last — from the team at Rex Haven Ventures.",
  alternates: { canonical: "/blog" },
};

/**
 * Blog index.
 *
 * Reads through `lib/blog-source`, which serves published posts from MongoDB
 * and falls back to the built-in content in `lib/articles.ts` when the database
 * is empty or unconfigured. The rendering below is unchanged — the same
 * `FeaturedArticle` and `BlogIndex` components, fed from a different source.
 */
export default async function BlogPage() {
  // Categories come from the database, falling back to the built-in defaults.
  const [{ featured, rest, data }, categories] = await Promise.all([
    getFeatured(),
    getCategoryNames(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Insights & Perspectives"
        title="Thinking worth sharing."
        description="Notes on investing, building, and partnership — how we see the work of turning opportunity into lasting value."
      />

      <section className="bg-cream pb-24 md:pb-32">
        <Container size="wide">
          {data.isDemoContent && (
            <p className="mb-10 inline-flex items-center gap-2 rounded-full border border-line bg-beige-light px-4 py-1.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-burgundy" aria-hidden />
              Demo content — illustrative perspective pieces, not investment advice.
            </p>
          )}

          {featured ? (
            <>
              <FeaturedArticle article={featured} />

              <div className="mt-20">
                <BlogIndex articles={rest} categories={categories} />
              </div>
            </>
          ) : (
            <EmptyState
              title="No insights published yet"
              description="We're preparing our first pieces. Please check back shortly, or get in touch in the meantime."
            />
          )}
        </Container>
      </section>

      <CTASection
        eyebrow="Get in Touch"
        title="Ideas are better in conversation."
        description="If something here resonates — or you'd push back on it — we'd genuinely like to hear from you."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "Learn About Us", href: "/about" }}
      />
    </>
  );
}
