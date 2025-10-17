/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don’t run ESLint in CI builds right now
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
