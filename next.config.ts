import withPWA from 'next-pwa'
import type { NextConfig } from "next"

const config = {
  reactStrictMode: true,
  webpack: (config: any, { webpack }: { webpack: any }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "punycode": false,
    };
    return config;
  },
} as const

const nextConfig = withPWA({
  dest: 'public',
  disable: false,
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24
        }
      }
    }
  ]
}) as unknown as (config: NextConfig) => NextConfig

export default nextConfig(config)
