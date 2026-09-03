"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/lib/articles";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { Search } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

/** "All", or any category name from the database. */
type Filter = string;

export function BlogIndex({
  articles,
  categories,
}: {
  articles: Article[];
  categories: string[];
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filters: Filter[] = ["All", ...categories];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesCategory = filter === "All" || a.category === filter;
      const matchesQuery =
        q === "" ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [articles, filter, query]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
                  active
                    ? "border-burgundy bg-burgundy text-cream"
                    : "border-line text-muted hover:border-burgundy/40 hover:text-burgundy",
                )}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search insights…"
            className="w-full rounded-full border border-line bg-cream py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-burgundy/40 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
          />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((article, i) => (
            <ArticleCard key={article.slug} article={article} delay={(i % 3) * 70} />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-[6px] border border-line bg-beige-light/60 py-16 text-center">
          <p className="font-serif text-xl text-ink">No matching insights</p>
          <p className="mt-2 text-sm text-muted">
            Try a different search or category.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("All");
              setQuery("");
            }}
            className="mt-6 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
