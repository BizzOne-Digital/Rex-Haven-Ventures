import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatArticleDate } from "@/lib/articles";
import { ArticleCover } from "@/components/blog/ArticleCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/** Prominent, horizontal feature treatment for the lead blog article. */
export function FeaturedArticle({ article }: { article: Article }) {
  return (
    <Reveal>
      <article>
        <Link
          href={`/blog/${article.slug}`}
          className="group grid overflow-hidden rounded-[6px] border border-line bg-cream shadow-soft transition-[border-color,box-shadow] duration-500 ease-out hover:border-burgundy/30 hover:shadow-lift lg:grid-cols-2"
        >
          <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[26rem]">
            <ArticleCover
              cover={article.cover}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>

          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-14">
            <div className="flex items-center gap-4">
              <Eyebrow>Featured</Eyebrow>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {article.category}
              </span>
            </div>

            <h3 className="mt-6 font-serif text-3xl leading-tight text-ink transition-colors duration-300 group-hover:text-burgundy md:text-[2.35rem]">
              {article.title}
            </h3>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              {article.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
              <span aria-hidden className="text-line-dark">&middot;</span>
              <span>{article.readingMinutes} min read</span>
            </div>

            <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-burgundy">
              Read the article
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </article>
    </Reveal>
  );
}
