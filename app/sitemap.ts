import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getArticleSitemapEntries } from "@/lib/blog-source";

/**
 * Sitemap.
 *
 * Article URLs come from `lib/blog-source`, which merges published database
 * posts with the built-in content — so previously indexed URLs keep resolving
 * after the blog moves into MongoDB.
 *
 * The member and admin routes are deliberately absent: they are private, and
 * each of those pages also sets `robots: { index: false }`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.9 },
  ];

  const entries = await getArticleSitemapEntries();

  const blogRoutes: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${base}/blog/${entry.slug}`,
    lastModified: new Date(entry.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
