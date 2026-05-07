import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/UTMS',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
