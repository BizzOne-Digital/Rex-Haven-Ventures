import { connectToDatabase, syncIndexes } from "@/lib/db/mongoose";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";
import { revalidateBlog } from "@/lib/post-payload";
import { articles as builtInArticles } from "@/lib/articles";
import { seedDefaultCategories } from "@/lib/category-source";

/**
 * POST /api/admin/seed — import the built-in articles into MongoDB.
 *
 * `lib/articles.ts` is the original, file-based blog content. Until it is
 * imported, the public blog reads straight from that file (see
 * `lib/blog-source.ts`) and the admin has nothing to edit. This brings it under
 * database management in one step, without touching the source file.
 *
 * Idempotent: existing slugs are skipped, never overwritten, so running it
 * twice cannot clobber edits an administrator has already made.
 */
export async function POST() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await connectToDatabase();
    await syncIndexes();

    // Categories first: posts reference them by name.
    const seededCategories = await seedDefaultCategories();

    const existingSlugs = new Set(
      (await BlogPost.find({}).select("slug").lean<{ slug: string }[]>()).map((p) => p.slug),
    );

    const toInsert = builtInArticles
      .filter((article) => !existingSlugs.has(article.slug))
      .map((article) => ({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        date: article.date,
        readingMinutes: article.readingMinutes,
        author: article.author,
        cover: article.cover,
        ...(article.coverImage ? { coverImage: article.coverImage } : {}),
        featured: Boolean(article.featured),
        // Imported as published so the public blog looks unchanged afterwards.
        status: "published" as const,
        content: article.content,
        seededFrom: "lib/articles.ts",
      }));

    if (toInsert.length > 0) {
      await BlogPost.insertMany(toInsert, { ordered: false });
      revalidateBlog(toInsert.map((post) => post.slug));
    }

    return ok({
      ok: true,
      seededCategories,
      imported: toInsert.length,
      skipped: builtInArticles.length - toInsert.length,
      total: existingSlugs.size + toInsert.length,
    });
  } catch (error) {
    return handleRouteError(error, "admin/seed");
  }
}
