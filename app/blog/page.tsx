import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { CTASection } from "@/components/ui/CTASection";
import { FeaturedArticle } from "@/components/cards/FeaturedArticle";
import { BlogIndex } from "@/components/blog/BlogIndex";
import {
  categories,
  getFeaturedArticle,
  getListedArticles,
  CONTENT_IS_DEMO,
} from "@/lib/articles";

export const metadata: Metadata = {
  title: "Insights & Perspectives",
  description:
    "Perspectives on investing, entrepreneurship, and building businesses that last — from the team at Rex Haven Ventures.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const featured = getFeaturedArticle();
  const listed = getListedArticles();

  return (
    <>
      <PageHero
        eyebrow="Insights & Perspectives"
        title="Thinking worth sharing."
        description="Notes on investing, building, and partnership — how we see the work of turning opportunity into lasting value."
      />

      <section className="bg-cream pb-24 md:pb-32">
        <Container size="wide">
          {CONTENT_IS_DEMO && (
            <p className="mb-10 inline-flex items-center gap-2 rounded-full border border-line bg-beige-light px-4 py-1.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-burgundy" aria-hidden />
              Demo content — illustrative perspective pieces, not investment advice.
            </p>
          )}

          <FeaturedArticle article={featured} />

          <div className="mt-20">
            <BlogIndex articles={listed} categories={categories} />
          </div>
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
