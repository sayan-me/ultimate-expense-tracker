"use client"

import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface CurrentBalanceProps {
  isLoading?: boolean;
  initialBalance?: number;
}

export function CurrentBalance({ isLoading = false, initialBalance = 0 }: CurrentBalanceProps) {
  const totalBalance = initialBalance;

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <Skeleton className="h-4 w-24" data-testid="skeleton-title" />
        <Skeleton className="mt-2 h-8 w-32" data-testid="skeleton-balance" />
        <div className="mt-4">
          <Skeleton className="h-4 w-28" data-testid="skeleton-subtitle" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
      <p className="mt-2 text-3xl font-bold">{formatCurrency(totalBalance)}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Across all accounts
        </div>
      </div>
    </div>
  )
} 