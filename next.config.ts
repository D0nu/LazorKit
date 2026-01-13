import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
  

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', 
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
    ],
  },
  
  // Required for WebAuthn to work on Vercel
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Permissions-Policy',
            value: 'publickey-credentials-get=(self)',
          },
        ],
      },
    ];
  },

};

export default nextConfig;
