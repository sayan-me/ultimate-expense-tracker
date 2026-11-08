import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'
import { randomUUID } from 'node:crypto'

// Revision for the precached offline fallback page (changes every build)
const revision = randomUUID()

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/offline', revision }],
  // The service worker is only built for production; avoids stale caches in dev.
  disable: process.env.NODE_ENV === 'development',
})

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: false,
    }
    return config
  },
}

export default withSerwist(config)
