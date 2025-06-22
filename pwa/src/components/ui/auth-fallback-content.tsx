"use client"

import { Button } from "./button"
import { CardContent } from "./card"
import { useRouter } from "next/navigation"

interface AuthFallbackContentProps {
  type: "registered" | "premium"
}

export function AuthFallbackContent({ type }: AuthFallbackContentProps) {
  const router = useRouter()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  const handleAuthClick = () => {
    router.push(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`)
  }

  return (
    <CardContent>
      <p className="mb-4">
        {type === "registered" 
          ? "Please login to access this feature!"
          : "Subscribe to access premium features!"}
      </p>
      <Button onClick={handleAuthClick}>
        {type === "registered" ? "Login" : "Subscribe"}
      </Button>
    </CardContent>
  )
} 