import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { PostEditor } from "@/components/admin/PostEditor";
import { Alert } from "@/components/ui/Alert";
import { getCurrentUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongoose";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { toAdminPost } from "@/lib/post-view";
import { serializeBody } from "@/lib/post-validation";
import { getCategoryNames } from "@/lib/category-source";

export const metadata: Metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

/**
 * Post editor for an existing post.
 *
 * Loads the post on the server so the editor renders fully populated on first
 * paint — no loading spinner, and no flash of an empty form. Re-checks the
 * administrator role here rather than relying solely on the parent layout,
 * because this page reads privileged data (drafts) directly.
 */
export default async function AdminEditPostPage({
  params,
}: PageProps<"/admin/blog/[id]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/login");

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();

  // Only the database read is guarded. `notFound()` works by throwing a control
  // -flow signal Next.js has to receive, so it is called outside the try block.
  let loaded: { post: ReturnType<typeof toAdminPost>; body: string } | null = null;

  try {
    await connectToDatabase();
    // `.lean()` is required, not just an optimisation: a hydrated Mongoose
    // document's subdocuments hold circular references back to their parent,
    // and handing one to a Client Component makes the RSC serializer recurse
    // until the stack overflows. Route handlers escape this because
    // `Response.json` goes through `toJSON()`; props do not.
    const post = await BlogPost.findById(id).lean<BlogPostDocument | null>();
    if (post) {
      loaded = { post: toAdminPost(post), body: serializeBody(post.content) };
    }
  } catch {
    return (
      <Alert tone="error" title="We couldn't load this post">
        The database is unreachable right now. Please try again in a moment.
      </Alert>
    );
  }

  if (!loaded) notFound();

  const categories = await getCategoryNames();

  return (
    <PostEditor post={loaded.post} initialBody={loaded.body} categories={categories} />
  );
}
