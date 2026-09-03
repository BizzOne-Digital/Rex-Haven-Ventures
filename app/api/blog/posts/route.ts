import { getBlogData } from "@/lib/blog-source";
import { handleRouteError, ok } from "@/lib/api";

/**
 * GET /api/blog/posts — publicly visible articles.
 *
 * Serves whatever `lib/blog-source` resolves: published database posts, or the
 * built-in content when the database is empty or unconfigured. Draft posts are
 * never included. `content` is omitted — the list view doesn't need the full
 * body, and leaving it out keeps the payload small.
 */
export async function GET() {
  try {
    const { articles, source } = await getBlogData();

    return ok({
      source,
      total: articles.length,
      // Summary view: the full body is served by the per-slug endpoint.
      items: articles.map((article) => {
        const { content, ...summary } = article;
        void content;
        return summary;
      }),
    });
  } catch (error) {
    return handleRouteError(error, "blog/posts");
  }
}
