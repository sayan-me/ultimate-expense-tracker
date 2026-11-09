"use client"

import { Header } from "@/components/layout/header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ActivitiesBar } from "@/components/layout/activities-bar"
import { ExpenseModalHandler } from "@/components/global/expense-modal-handler"
import { cn } from "@/lib/utils"

interface RootLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* pb-28 (112px) = BottomNav's h-16 (64px) + the collapsed
          ActivitiesBar's h-12 (48px) sitting above it. A plain pb-16
          only cleared the nav bar, so content near the bottom of a page
          (e.g. the last card on /settings or /auth/login) was hidden
          under the collapsed activities sheet — see M5 in the bug
          report. One shared value here, not per page. */}
      <main className={cn("flex-1 container pb-28", className)}>
        {children}
      </main>
      <ActivitiesBar />
      <BottomNav />
      <ExpenseModalHandler />
    </div>
  )
} 