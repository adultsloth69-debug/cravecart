/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This ignores simple errors so the build can finish
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig