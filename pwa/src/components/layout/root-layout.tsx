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
      <main className={cn("flex-1 container pb-16", className)}>
        {children}
      </main>
      <ActivitiesBar />
      <BottomNav />
      <ExpenseModalHandler />
    </div>
  )
} 