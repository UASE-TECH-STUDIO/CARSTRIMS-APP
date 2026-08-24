/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  poweredByHeader: false,

  webpack: (config) => {
    // onnxruntime-web (a peer dependency of @imgly/background-removal,
    // used for AI background removal) ships pre-built, self-contained
    // .mjs bundles under its dist/ folder - these already include
    // their own minification and use import.meta internally in a way
    // that fails when Next.js's build tries to re-parse/re-minify
    // them as part of the app's own bundle. Marking them as
    // "don't parse for dependencies" tells webpack to include the
    // file as-is rather than analyzing or minifying its contents,
    // which avoids that failure without touching how any other
    // package in the app is bundled.
    const existingNoParse = config.module.noParse;
    const onnxNoParse = /onnxruntime-web[\\/]dist[\\/].*\.mjs$/;
    config.module.noParse = existingNoParse
      ? (Array.isArray(existingNoParse) ? [...existingNoParse, onnxNoParse] : [existingNoParse, onnxNoParse])
      : onnxNoParse;
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "carstrims-backend.onrender.com" },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
  },

  async headers() {
    return [
      {
        source: "/:all*(ico|png|jpg|jpeg|svg|gif|webp|avif|mp3|woff|woff2)",
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
    ];
  },
};

export default nextConfig;
