/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  poweredByHeader: false,
  images: {
    domains: ["res.cloudinary.com"],
    formats: ["image/webp"],
  },
};

export default nextConfig;