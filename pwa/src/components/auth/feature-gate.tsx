"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

type FeatureLevel = "registered" | "premium"

interface FeatureGateProps {
  level: FeatureLevel
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ level, children, fallback }: FeatureGateProps) {
  const { user } = useAuth()
  const isAuthenticated = !!user

  // Registered features need authentication
  if (level === "registered" && !isAuthenticated) {
    return fallback ? <>{fallback}</> : null
  }

  // Premium features
  if (level === "premium") {
    if (!isAuthenticated) {
      return fallback ? <>{fallback}</> : null
    }
    // Later: Check if user has premium subscription
  }

  return <>{children}</>
} 