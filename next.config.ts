import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Configure Server Actions for PDF upload (5MB PDFs + base64 encoding overhead)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Allows for 5MB PDFs encoded as base64
    },
  },

  images: {
    // This allows using <Image /> with external URLs
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // adjust this for tighter security
      },
    ],
  },

  typescript: {
    // Set to true if you want builds to succeed even with TS errors
    ignoreBuildErrors: false,
  },

  eslint: {
    // Set to true if you want builds to skip ESLint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
