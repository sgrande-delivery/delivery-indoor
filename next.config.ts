import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 's3.sa-east-1.amazonaws.com', pathname: '/sg-delivery/**' }],
  },
  reactStrictMode: false,
};

export default nextConfig;
