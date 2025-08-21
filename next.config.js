/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removing the static export configuration
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
