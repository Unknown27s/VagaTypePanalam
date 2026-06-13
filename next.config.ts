import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /** @type {import('next').NextConfig} */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
};

export default nextConfig;
