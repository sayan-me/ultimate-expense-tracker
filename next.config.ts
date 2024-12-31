import withPWA from 'next-pwa'
import type { NextConfig } from "next"

const config = {
  reactStrictMode: true,
} as const

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
}) as unknown as (config: NextConfig) => NextConfig

export default nextConfig(config)
