"use client"

import { CurrentBalance } from "@/components/home/overview/current-balance"
import { MonthlySpend } from "@/components/home/overview/monthly-spend"
import { RecentExpenses } from "@/components/home/overview/recent-expenses"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivities } from "@/contexts/activities-context"

interface Expense {
  id: string
  date: Date
  amount: number
  category: string
  description: string
}

interface OverviewProps {
  isLoading?: boolean;
  initialData?: {
    balance: number;
    monthlySpend: number;
    monthlyBudget: number;
    recentExpenses: Expense[];
  };
}

export function Overview({ isLoading = false, initialData }: OverviewProps) {
  const { isGroupMode } = useActivities()

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
        <CurrentBalance isLoading={isLoading} initialBalance={initialData?.balance} />
        <MonthlySpend isLoading={isLoading} />
        <RecentExpenses isLoading={isLoading} />
      </section>
    )
  }

  // Group mode will be implemented later
  return null
} 