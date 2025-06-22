"use client"

import { useEffect } from "react"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <span className="ml-2">Failed to load notifications</span>
      </Alert>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred while loading your notifications"}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
} 