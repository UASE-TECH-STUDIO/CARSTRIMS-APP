/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol:"https", hostname:"res.cloudinary.com" },
      { protocol:"https", hostname:"*.cloudinary.com" },
    ],
  },
  // Enable compression
  compress: true,
  // Optimize build
  poweredByHeader: false,
  // Trailing slash
  trailingSlash: false,
};

module.exports = nextConfig;
