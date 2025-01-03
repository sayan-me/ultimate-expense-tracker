"use client"

import { CurrentBalance } from "@/components/home/overview/current-balance"
import { MonthlySpend } from "@/components/home/overview/monthly-spend"
import { RecentExpenses } from "@/components/home/overview/recent-expenses"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivities } from "@/contexts/activities-context"

export function Overview() {
  const { isGroupMode } = useActivities()
  const isLoading = false // This will be connected to global state later

  if (isLoading) {
    return (
      <section className="space-y-6" aria-label="Financial overview">
        <Skeleton className="h-[160px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </section>
    )
  }

  if (!isGroupMode) {
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