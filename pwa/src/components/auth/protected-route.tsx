"use client"

import { type ReactNode, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  const isAuthenticated = !!user

  useEffect(() => {
    console.log('Auth State:', { isAuthenticated, loading })
    if (!loading && !isAuthenticated) {
      console.log('Redirecting to login...')
      router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`)
    }
  }, [loading, isAuthenticated, router, pathname])

  if (loading) {
    return null // Will show the loading.tsx
  }

  return isAuthenticated ? children : null
} 