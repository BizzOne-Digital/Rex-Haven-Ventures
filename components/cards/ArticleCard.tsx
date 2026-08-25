import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatArticleDate } from "@/lib/articles";
import { ArticleCover } from "@/components/blog/ArticleCover";
import { ArrowRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/** Standard article card for blog grids and the homepage insights preview. */
export function ArticleCard({ article, delay = 0 }: { article: Article; delay?: number }) {
  return (
    <Reveal className="h-full" delay={delay}>
      <article className="h-full">
        <Link
          href={`/blog/${article.slug}`}
          className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-line bg-cream shadow-soft transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-burgundy/30 hover:shadow-lift"
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            <ArticleCover
              cover={article.cover}
              image={article.coverImage}
              alt={article.title}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <span className="absolute left-4 top-4 rounded-full bg-cream/92 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-burgundy-deep backdrop-blur-sm">
              {article.category}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-7">
            <div className="flex items-center gap-2 text-xs text-muted">
              <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
              <span aria-hidden className="text-line-dark">&middot;</span>
              <span>{article.readingMinutes} min read</span>
            </div>

            <h3 className="mt-3 font-serif text-xl leading-snug text-ink transition-colors duration-300 group-hover:text-burgundy">
              {article.title}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
              {article.excerpt}
            </p>

            <span className="mt-6 inline-flex items-center gap-2 pt-1 text-sm font-medium text-burgundy">
              Read article
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </article>
    </Reveal>
  );
}
