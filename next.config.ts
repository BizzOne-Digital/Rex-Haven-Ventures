import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Uploaded images are served from this app's own `/api/uploads/**` route,
     * which is a local path — `next/image` allows those without configuration,
     * so no entry is needed for them here. `localPatterns` is deliberately left
     * unset: adding it would switch local images to deny-by-default and break
     * the statically imported brand assets.
     *
     * Only genuinely external hosts belong below. Cloudinary is gone: uploads
     * now live in MongoDB (see `lib/uploads.ts`).
     */
    remotePatterns: [
      { protocol: "https", hostname: "static.vecteezy.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
    ],
  },
};

export default nextConfig;
