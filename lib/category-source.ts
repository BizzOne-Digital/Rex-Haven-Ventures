import "server-only";
import { categories as builtInCategories } from "@/lib/articles";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { Category, type CategoryDocument } from "@/lib/db/models/Category";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { slugify } from "@/lib/sanitize";
import type { AdminCategory } from "@/lib/category-types";

/**
 * Category resolution, mirroring `lib/blog-source.ts`.
 *
 * Database first, built-in defaults as the fallback — so the public blog's
 * category filter row keeps working before any category has been created, and
 * if the database is unreachable.
 */

export function toAdminCategory(doc: CategoryDocument, postCount = 0): AdminCategory {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    order: doc.order,
    postCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Category names for the public filter row, in display order. */
export async function getCategoryNames(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [...builtInCategories];

  try {
    await connectToDatabase();
    const docs = await Category.find({})
      .sort({ order: 1, name: 1 })
      .select("name")
      .lean<{ name: string }[]>();

    if (docs.length === 0) return [...builtInCategories];
    return docs.map((doc) => doc.name);
  } catch (error) {
    console.error("[category-source] falling back to built-in categories:", error);
    return [...builtInCategories];
  }
}

/**
 * Categories with the number of posts in each, for the admin screen.
 * Counts come from one grouped aggregation rather than a query per category.
 */
export async function getCategoriesWithCounts(): Promise<AdminCategory[]> {
  await connectToDatabase();

  const [docs, grouped] = await Promise.all([
    Category.find({}).sort({ order: 1, name: 1 }).lean<CategoryDocument[]>(),
    BlogPost.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = new Map(grouped.map((row) => [row._id, row.count]));
  return docs.map((doc) => toAdminCategory(doc, counts.get(doc.name) ?? 0));
}

/**
 * Validates a category name against the live set.
 *
 * Accepts the built-in defaults when the collection is empty, so creating a
 * post never becomes impossible just because categories haven't been seeded.
 */
export async function isValidCategoryName(name: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const total = await Category.countDocuments({});
    if (total === 0) return builtInCategories.includes(name);
    return (await Category.exists({ name })) !== null;
  } catch {
    return builtInCategories.includes(name);
  }
}

/**
 * Creates the built-in categories if the collection is empty. Idempotent.
 * Called by the import/seed route alongside the built-in articles.
 */
export async function seedDefaultCategories(): Promise<number> {
  await connectToDatabase();

  const existing = new Set(
    (await Category.find({}).select("name").lean<{ name: string }[]>()).map((c) => c.name),
  );

  const toInsert = builtInCategories
    .filter((name) => !existing.has(name))
    .map((name, index) => ({
      name,
      slug: slugify(name),
      order: existing.size + index,
    }));

  if (toInsert.length === 0) return 0;
  await Category.insertMany(toInsert, { ordered: false });
  return toInsert.length;
}
