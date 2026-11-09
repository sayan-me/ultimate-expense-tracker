"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * In-app back navigation. Before this, the only way off a non-home page
 * (login, settings, history, …) was the browser's own back button — no
 * app-level back arrow, breadcrumb, or clickable home link existed
 * anywhere in the layout.
 */
export function BackButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === "/") return null

  const handleBack = () => {
    // A direct deep link or a cold PWA start has no in-app history to
    // go back to — router.back() would silently do nothing then.
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      aria-label="Go back"
      className="h-11 w-11 -ml-2 shrink-0"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  )
}
