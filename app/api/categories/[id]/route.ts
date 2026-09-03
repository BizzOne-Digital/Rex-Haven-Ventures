import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Category } from "@/lib/db/models/Category";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { toAdminCategory } from "@/lib/category-source";
import { revalidateBlog } from "@/lib/post-payload";
import { sanitizeText, slugify } from "@/lib/sanitize";
import {
  hasCategoryErrors,
  validateCategory,
  type CategoryValues,
} from "@/lib/category-validation";

/**
 * A single category.
 *
 *   PATCH  /api/categories/:id — rename / re-slug / re-describe / reorder
 *   DELETE /api/categories/:id — remove it
 *
 * Two rules protect referential integrity, since posts reference a category by
 * name rather than by id:
 *
 *  - A rename rewrites `category` on every post that carried the old name, in
 *    the same request, so no post is left pointing at a name that is gone.
 *  - A delete is refused while posts still use the category, unless the caller
 *    passes `reassignTo` naming an existing category to move them to.
 */

export async function PATCH(request: Request, { params }: RouteContext<"/api/categories/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that category.");

  const body = await readJson<Partial<CategoryValues>>(request);
  if (!body) return errors.badRequest();

  try {
    await connectToDatabase();
    const category = await Category.findById(id);
    if (!category) return errors.notFound("We couldn't find that category.");

    const previousName = category.name;

    const values: CategoryValues = {
      name: body.name ?? category.name,
      slug: body.slug ?? category.slug,
      description: body.description ?? category.description ?? "",
      order: body.order ?? String(category.order),
    };
    if (!values.slug.trim()) values.slug = slugify(values.name);

    const fieldErrors = validateCategory(values);
    if (hasCategoryErrors(fieldErrors)) {
      return errors.validation(fieldErrors as Record<string, string>);
    }

    const name = sanitizeText(values.name).trim();
    const slug = slugify(values.slug);

    if (name !== previousName && (await Category.exists({ name, _id: { $ne: category._id } }))) {
      return errors.validation(
        { name: "A category with that name already exists." },
        "That category already exists.",
      );
    }
    if (slug !== category.slug && (await Category.exists({ slug, _id: { $ne: category._id } }))) {
      return errors.validation({ slug: "That slug is already in use." }, "That slug is in use.");
    }

    category.name = name;
    category.slug = slug;
    category.description = sanitizeText(values.description) || undefined;
    category.order = Number(values.order);
    await category.save();

    // Keep posts pointing at a name that still exists.
    let reassignedPosts = 0;
    if (name !== previousName) {
      const result = await BlogPost.updateMany(
        { category: previousName },
        { $set: { category: name } },
      );
      reassignedPosts = result.modifiedCount ?? 0;
    }

    revalidateBlog();
    return ok({
      ok: true,
      category: toAdminCategory(category, await BlogPost.countDocuments({ category: name })),
      reassignedPosts,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.conflict("That category name or slug is already in use.");
    }
    return handleRouteError(error, "categories/update");
  }
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/categories/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that category.");

  // `reassignTo` is optional and may arrive with no body at all.
  const body = await readJson<{ reassignTo?: string }>(request);
  const reassignTo = body?.reassignTo?.trim();

  try {
    await connectToDatabase();
    const category = await Category.findById(id);
    if (!category) return errors.notFound("We couldn't find that category.");

    const inUse = await BlogPost.countDocuments({ category: category.name });

    if (inUse > 0) {
      if (!reassignTo) {
        return errors.conflict(
          `${inUse} post${inUse === 1 ? "" : "s"} still use this category. Choose a category to move them to first.`,
        );
      }

      const target = await Category.findOne({ name: reassignTo });
      if (!target) {
        return errors.validation(
          { name: "That replacement category doesn't exist." },
          "We couldn't find the category you asked us to move those posts to.",
        );
      }
      if (target.name === category.name) {
        return errors.badRequest("Choose a different category to move those posts to.");
      }

      await BlogPost.updateMany(
        { category: category.name },
        { $set: { category: target.name } },
      );
    }

    // Refuse to leave the blog with no categories at all.
    if ((await Category.countDocuments({})) <= 1) {
      return errors.conflict(
        "This is the last category. Create another one before deleting this.",
      );
    }

    await category.deleteOne();
    revalidateBlog();

    return ok({ ok: true, reassignedPosts: inUse, reassignedTo: reassignTo ?? null });
  } catch (error) {
    return handleRouteError(error, "categories/delete");
  }
}
