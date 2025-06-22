"use client"

import { type ReactNode, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log('Auth State:', { isAuthenticated, isLoading })
    if (!isLoading && !isAuthenticated) {
      console.log('Redirecting to login...')
      router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading) {
    return null // Will show the loading.tsx
  }

  return isAuthenticated ? children : null
} 