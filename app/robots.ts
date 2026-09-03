import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces: the API, the member area and the admin dashboard.
        // Each of those pages also sets `robots: { index: false }` in metadata.
        disallow: ["/api/", "/admin", "/account", "/login", "/signup"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
