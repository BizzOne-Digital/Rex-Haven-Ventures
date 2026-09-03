import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { buildPostPayload, revalidateBlog } from "@/lib/post-payload";
import {
  emptyPostValues,
  hasPostErrors,
  serializeBody,
  serializeTags,
  validatePost,
  type PostValues,
} from "@/lib/post-validation";
import { toAdminPost } from "@/lib/post-view";
import { isValidCategoryName } from "@/lib/category-source";

/**
 * A single blog post, for administrators.
 *
 *   GET    /api/admin/posts/:id — load into the editor (drafts included)
 *   PATCH  /api/admin/posts/:id — save edits, or flip publish state
 *   DELETE /api/admin/posts/:id — remove it
 *
 * `PATCH` accepts either a full editor payload or just `{ status }`, which is
 * what the publish/unpublish toggle in the post list sends.
 */

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/posts/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that post.");

  try {
    await connectToDatabase();
    const post = await BlogPost.findById(id);
    if (!post) return errors.notFound("We couldn't find that post.");

    // `body` is the editor's plain-text representation of `content`.
    return ok({ post: toAdminPost(post), body: serializeBody(post.content) });
  } catch (error) {
    return handleRouteError(error, "admin/posts/get");
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/posts/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that post.");

  const body = await readJson<Partial<PostValues>>(request);
  if (!body) return errors.badRequest();

  try {
    await connectToDatabase();
    const post = await BlogPost.findById(id);
    if (!post) return errors.notFound("We couldn't find that post.");

    const previousSlug = post.slug;

    // Status-only update: the publish/unpublish toggle. Skip full validation so
    // an incomplete draft can still be taken offline.
    const isStatusOnly =
      typeof body.status === "string" && Object.keys(body).length === 1;

    if (isStatusOnly) {
      if (body.status !== "draft" && body.status !== "published") {
        return errors.validation({ status: "Status must be draft or published." });
      }
      post.status = body.status;
      await post.save();
      revalidateBlog([post.slug]);
      return ok({ ok: true, post: toAdminPost(post) });
    }

    const values: PostValues = {
      ...emptyPostValues,
      ...{
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        category: post.category,
        date: post.date,
        readingMinutes: String(post.readingMinutes),
        author: post.author,
        cover: post.cover,
        coverImage: post.coverImage ?? "",
        tags: serializeTags(post.tags ?? []),
        featured: post.featured,
        status: post.status,
        body: serializeBody(post.content),
        seoTitle: post.seoTitle ?? "",
        seoDescription: post.seoDescription ?? "",
      },
      ...body,
    } as PostValues;

    const fieldErrors = validatePost(values);
    if (hasPostErrors(fieldErrors)) {
      return errors.validation(fieldErrors as Record<string, string>);
    }

    const payload = buildPostPayload(values);

    if (!(await isValidCategoryName(payload.category))) {
      return errors.validation(
        { category: "That category doesn't exist. Choose one from the list." },
        "Please choose a valid category.",
      );
    }

    // Slug uniqueness, excluding this post.
    if (payload.slug !== previousSlug) {
      const clash = await BlogPost.exists({ slug: payload.slug, _id: { $ne: post._id } });
      if (clash) {
        return errors.validation(
          { slug: "That slug is already in use. Please choose another." },
          "That slug is already in use.",
        );
      }
    }

    if (payload.featured) {
      await BlogPost.updateMany(
        { featured: true, _id: { $ne: post._id } },
        { $set: { featured: false } },
      );
    }

    post.set(payload);
    await post.save();

    // Revalidate both slugs so a rename doesn't leave a stale page behind.
    revalidateBlog([previousSlug, post.slug]);

    return ok({ ok: true, post: toAdminPost(post), body: serializeBody(post.content) });
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
    return handleRouteError(error, "admin/posts/update");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/posts/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that post.");

  try {
    await connectToDatabase();
    const post = await BlogPost.findById(id);
    if (!post) return errors.notFound("We couldn't find that post.");

    const { slug } = post;
    await post.deleteOne();
    revalidateBlog([slug]);

    // Submissions are intentionally kept: they stay in the moderation record
    // with their denormalised `postSlug`/`postTitle`, so deleting a post never
    // silently erases a member's contribution history.
    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error, "admin/posts/delete");
  }
}
