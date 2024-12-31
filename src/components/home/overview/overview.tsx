"use client"

import { useState } from "react"
import { CurrentBalance } from "@/components/home/overview/current-balance"
import { MonthlySpend } from "@/components/home/overview/monthly-spend"
import { RecentExpenses } from "@/components/home/overview/recent-expenses"
import { Skeleton } from "@/components/ui/skeleton"

type Mode = 'personal' | 'group'

export function Overview() {
  const [activeMode] = useState<Mode>('personal')
  const [isLoading] = useState(false) // This will be connected to global state later

  if (isLoading) {
    return (
      <section className="space-y-6" aria-label="Financial overview">
        <Skeleton className="h-[160px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </section>
    )
  }

  if (activeMode === 'personal') {
    return (
      <section className="space-y-6" aria-label="Financial overview">
        <CurrentBalance isLoading={isLoading} />
        <MonthlySpend isLoading={isLoading} />
        <RecentExpenses isLoading={isLoading} />
      </section>
    )
  }

  // Group mode will be implemented later
  return null
} 