import type { Metadata } from "next";
import { PostManager } from "@/components/admin/PostManager";
import { getCategoryNames } from "@/lib/category-source";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage() {
  // Resolved server-side so the category filter is populated on first paint.
  const categories = await getCategoryNames();

  return <PostManager categories={categories} />;
}
