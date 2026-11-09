"use client"

import { type ReactNode, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  const isAuthenticated = !!user

  useEffect(() => {
    // router.push triggers a re-render (new pathname/searchParams), which
    // without this guard re-ran this effect and pushed a second time
    // before the navigation completed (C4 in the bug report).
    if (!loading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true
      router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, isAuthenticated, router, pathname])

  if (loading) {
    return null // Will show the loading.tsx
  }

  return isAuthenticated ? children : null
} 