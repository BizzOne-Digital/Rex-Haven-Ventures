import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/PostEditor";
import { getCategoryNames } from "@/lib/category-source";

export const metadata: Metadata = {
  title: "New Post",
  robots: { index: false, follow: false },
};

export default async function AdminNewPostPage() {
  // Categories are resolved on the server so the editor's dropdown is populated
  // on first paint — no empty select while a client fetch settles.
  const categories = await getCategoryNames();

  // No `post` prop: the editor starts empty and creates on first save.
  return <PostEditor categories={categories} />;
}
