import { getArticleBySlug } from "@/lib/blog-source";
import { errors, handleRouteError, ok } from "@/lib/api";

/**
 * GET /api/blog/posts/:slug — one publicly visible article, with its body.
 * Unpublished posts resolve as 404, exactly like a slug that doesn't exist.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/blog/posts/[slug]">) {
  try {
    const { slug } = await params;
    const result = await getArticleBySlug(slug);
    if (!result) return errors.notFound("We couldn't find that article.");

    return ok({ article: result.article, isDemoContent: result.isDemoContent });
  } catch (error) {
    return handleRouteError(error, "blog/posts/slug");
  }
}
