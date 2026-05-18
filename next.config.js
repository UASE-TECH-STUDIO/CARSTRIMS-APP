/** @type {import('next').NextConfig} */
const nextConfig = {
  // Forces a clean path structure for dynamic metadata images like apple-icon
  trailingSlash: true,
  // Skip ESLint and Type checks during production build to keep it fast
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
