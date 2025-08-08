import withPWA from 'next-pwa'
import type { NextConfig } from "next"
import type { Configuration } from 'webpack'

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config: Configuration) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "punycode": false,
    };
    return config;
  },
}

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
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
