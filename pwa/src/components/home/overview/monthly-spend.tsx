"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatCents } from "@/lib/money"
import { Skeleton } from "@/components/ui/skeleton"
import { useDB } from "@/contexts/db-context"

// No budget model exists yet (see ROADMAP Phase 2: category/overall budgets).
// Until then this is a fixed placeholder, not read from real data.
// In cents, like every other stored amount — see src/lib/money.ts.
const PLACEHOLDER_MONTHLY_BUDGET = 400000

export function MonthlySpend() {
  const { transactions } = useDB()
  const allTransactions = transactions.transactions

  const isLoading = allTransactions === undefined

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <Skeleton className="h-4 w-40" data-testid="skeleton-title" />
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-24" data-testid="skeleton-spent" />
              <Skeleton className="mt-1 h-4 w-20" data-testid="skeleton-spent-label" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16" data-testid="skeleton-budget" />
              <Skeleton className="mt-1 h-4 w-20" data-testid="skeleton-budget-label" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-full" data-testid="skeleton-progress" />
            <Skeleton className="h-3 w-12 ml-auto" data-testid="skeleton-percentage" />
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const spent = (allTransactions ?? [])
    .filter(
      (t) =>
        t.type === "expense" &&
        t.date.getFullYear() === now.getFullYear() &&
        t.date.getMonth() === now.getMonth()
    )
    .reduce((sum, t) => sum + t.amount, 0)
  const budget = PLACEHOLDER_MONTHLY_BUDGET
  const percentage = (spent / budget) * 100

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-destructive"
    if (percent >= 75) return "bg-warning"
    return "bg-primary"
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm" role="region" aria-label="Monthly spending overview">
      <h3 className="text-sm font-medium text-muted-foreground">Monthly Spend vs Budget</h3>
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-8">
          <div>
            <p className="text-xl font-bold">{formatCents(spent)}</p>
            <p className="text-sm text-muted-foreground">spent this month</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCents(budget)}</p>
            <p className="text-sm text-muted-foreground">monthly budget</p>
          </div>
        </div>
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className="h-2"
            indicatorClassName={cn(getProgressColor(percentage))}
            aria-label={`${percentage.toFixed(0)}% of monthly budget spent`}
          />
          <p className="text-xs text-muted-foreground text-right">
            {percentage.toFixed(0)}% used
          </p>
        </div>
      </div>
    </div>
  )
} 