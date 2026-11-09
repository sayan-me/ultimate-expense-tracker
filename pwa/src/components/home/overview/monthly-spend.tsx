"use client"

import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatCents } from "@/lib/money"
import { computeSpend, budgetStatus } from "@/lib/budget"
import { Skeleton } from "@/components/ui/skeleton"
import { useDB } from "@/contexts/db-context"

const LEVEL_COLOR = {
  ok: "bg-primary",
  warning: "bg-warning",
  over: "bg-destructive",
} as const

export function MonthlySpend() {
  const { transactions, budgets } = useDB()
  const allTransactions = transactions.transactions
  const overallBudget = budgets.useOverallBudget()

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
  const spent = computeSpend(allTransactions ?? [], { month: now.getMonth(), year: now.getFullYear() })

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm" role="region" aria-label="Monthly spending overview">
      <h3 className="text-sm font-medium text-muted-foreground">Monthly Spend vs Budget</h3>
      {!overallBudget ? (
        <div className="mt-4 space-y-2">
          <p className="text-xl font-bold">{formatCents(spent)}</p>
          <p className="text-sm text-muted-foreground">spent this month</p>
          <Link href="/budgets" className="text-sm text-primary hover:underline">
            Set a budget to track your spending
          </Link>
        </div>
      ) : (
        (() => {
          const { percentage, level } = budgetStatus(spent, overallBudget.amount)
          const displayPercentage = Number.isFinite(percentage) ? percentage : 999
          return (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-8">
                <div>
                  <p className="text-xl font-bold">{formatCents(spent)}</p>
                  <p className="text-sm text-muted-foreground">spent this month</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{formatCents(overallBudget.amount)}</p>
                  <p className="text-sm text-muted-foreground">monthly budget</p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress
                  value={Math.min(displayPercentage, 100)}
                  className="h-2"
                  indicatorClassName={cn(LEVEL_COLOR[level])}
                  data-level={level}
                  aria-label={`${displayPercentage.toFixed(0)}% of monthly budget spent`}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {displayPercentage.toFixed(0)}% used
                </p>
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}
