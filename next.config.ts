import withPWA from 'next-pwa'
import type { NextConfig } from "next"

const config = {
  reactStrictMode: true,
} as const

const nextConfig = withPWA({
  dest: 'public',
  // disable: process.env.NODE_ENV === 'development',
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
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        }
      }
    }
  ]
}) as unknown as (config: NextConfig) => NextConfig

export default nextConfig(config)
