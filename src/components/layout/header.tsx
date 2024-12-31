"use client"

import { UserNav } from "@/components/layout/user-nav"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { format } from "date-fns"

export function Header() {
  const today = format(new Date(), "EEEE, MMMM do")
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{getGreeting()}, User!</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center space-x-2">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
} 