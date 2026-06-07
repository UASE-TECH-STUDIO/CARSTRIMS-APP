import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: compress responses
  compress: true,

  // Performance: aggressive image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "carstrims-backend.onrender.com" },
    ],
    minimumCacheTTL: 86400,
    formats: ["image/webp", "image/avif"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280],
    imageSizes: [64, 128, 192, 256],
  },

  // Performance: aggressive headers for static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|mp3|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Reduce bundle size
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
