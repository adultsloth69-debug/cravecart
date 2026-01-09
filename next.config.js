/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // <--- THIS IS THE MAGIC LINE
  images: {
    unoptimized: true, // Required for GitHub Pages
  },
}

module.exports = nextConfig