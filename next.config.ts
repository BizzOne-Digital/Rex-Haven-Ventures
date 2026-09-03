import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary-hosted uploads. `next/image` refuses any host not listed
      // here, so without this every image in the media library 400s.
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "static.vecteezy.com" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
    ],
  },
};

export default nextConfig;
