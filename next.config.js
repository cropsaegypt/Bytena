/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db', './prisma/**/*'],
      '/api/**/*': ['./prisma/dev.db', './prisma/**/*'],
    },
  },
};

module.exports = nextConfig;
