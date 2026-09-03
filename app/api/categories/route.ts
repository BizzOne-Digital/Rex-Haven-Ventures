import { connectToDatabase } from "@/lib/db/mongoose";
import { Category } from "@/lib/db/models/Category";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { getCategoriesWithCounts, getCategoryNames, toAdminCategory } from "@/lib/category-source";
import { revalidateBlog } from "@/lib/post-payload";
import { sanitizeText, slugify } from "@/lib/sanitize";
import {
  emptyCategoryValues,
  hasCategoryErrors,
  validateCategory,
  type CategoryValues,
} from "@/lib/category-validation";

/**
 * Categories.
 *
 *   GET  /api/categories — public list; admins additionally get post counts
 *   POST /api/categories — create one (admin only)
 *
 * The public shape is names only: the blog's filter row needs nothing else, and
 * counts would leak how many drafts exist.
 */

export async function GET(request: Request) {
  const wantsDetail = new URL(request.url).searchParams.get("detail") === "1";

  try {
    if (!wantsDetail) {
      const names = await getCategoryNames();
      return ok({ items: names, total: names.length });
    }

    // Detailed view is admin-only — it includes draft counts.
    const { response } = await requireAdmin();
    if (response) return response;

    const items = await getCategoriesWithCounts();
    return ok({ items, total: items.length });
  } catch (error) {
    return handleRouteError(error, "categories/list");
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await readJson<Partial<CategoryValues>>(request);
  if (!body) return errors.badRequest();

  const values: CategoryValues = { ...emptyCategoryValues, ...body };
  // Derive the slug from the name when the field was left blank.
  if (!values.slug.trim()) values.slug = slugify(values.name);

  const fieldErrors = validateCategory(values);
  if (hasCategoryErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    await connectToDatabase();

    const name = sanitizeText(values.name).trim();
    const slug = slugify(values.slug);

    if (await Category.exists({ name })) {
      return errors.validation(
        { name: "A category with that name already exists." },
        "That category already exists.",
      );
    }
    if (await Category.exists({ slug })) {
      return errors.validation(
        { slug: "That slug is already in use." },
        "That slug is already in use.",
      );
    }

    const created = await Category.create({
      name,
      slug,
      description: sanitizeText(values.description) || undefined,
      order: Number(values.order),
    });

    revalidateBlog();
    return ok({ ok: true, category: toAdminCategory(created, 0) }, 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.conflict("That category name or slug is already in use.");
    }
    return handleRouteError(error, "categories/create");
  }
}
