import { connectToDatabase } from "@/lib/db/mongoose";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { buildPostPayload, revalidateBlog } from "@/lib/post-payload";
import {
  emptyPostValues,
  hasPostErrors,
  serializeBody,
  validatePost,
  type PostValues,
} from "@/lib/post-validation";
import { toAdminPost } from "@/lib/post-view";
import { containsRegex } from "@/lib/regex-escape";
import { isValidCategoryName } from "@/lib/category-source";

/**
 * Blog posts, for administrators.
 *
 *   GET  /api/admin/posts — every post, drafts included
 *   POST /api/admin/posts — create one
 *
 * Unlike the public endpoint this returns drafts, which is exactly why it sits
 * behind `requireAdmin`.
 */

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (status === "draft" || status === "published") filter.status = status;
    if (q) {
      const safe = containsRegex(q);
      filter.$or = [{ title: safe }, { slug: safe }, { excerpt: safe }];
    }

    const posts = await BlogPost.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean<BlogPostDocument[]>();

    const [published, drafts] = await Promise.all([
      BlogPost.countDocuments({ status: "published" }),
      BlogPost.countDocuments({ status: "draft" }),
    ]);

    return ok({
      items: posts.map(toAdminPost),
      counts: { total: published + drafts, published, drafts },
    });
  } catch (error) {
    return handleRouteError(error, "admin/posts/list");
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await readJson<Partial<PostValues>>(request);
  if (!body) return errors.badRequest();

  const values: PostValues = { ...emptyPostValues, ...body } as PostValues;
  const fieldErrors = validatePost(values);
  if (hasPostErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    await connectToDatabase();
    const payload = buildPostPayload(values);

    // Category membership can only be checked against the live collection.
    if (!(await isValidCategoryName(payload.category))) {
      return errors.validation(
        { category: "That category doesn't exist. Choose one from the list." },
        "Please choose a valid category.",
      );
    }

    if (await BlogPost.exists({ slug: payload.slug })) {
      return errors.validation(
        { slug: "That slug is already in use. Please choose another." },
        "That slug is already in use.",
      );
    }

    // Only one post can hold the featured slot on the blog index.
    if (payload.featured) {
      await BlogPost.updateMany({ featured: true }, { $set: { featured: false } });
    }

    const created = await BlogPost.create(payload);
    revalidateBlog([created.slug]);

    return ok({ ok: true, post: toAdminPost(created), body: serializeBody(created.content) }, 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.validation(
        { slug: "That slug is already in use. Please choose another." },
        "That slug is already in use.",
      );
    }
    return handleRouteError(error, "admin/posts/create");
  }
}
