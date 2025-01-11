"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"

interface BalanceEntry {
  memberId: string
  memberName: string
  amount: number  // positive = owes group, negative = group owes
}

interface OutstandingBalancesProps {
  isLoading?: boolean
  initialData?: {
    balances: BalanceEntry[]
  }
}

export function OutstandingBalances({ isLoading = false, initialData }: OutstandingBalancesProps) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!initialData && !isLoading) {
      setError(new Error('Failed to load balances data'))
    }
  }, [initialData, isLoading])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load balances: {error.message}</span>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-4 w-40" data-testid="skeleton-title" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" data-testid={`skeleton-name-${i}`} />
              <Skeleton className="h-4 w-24" data-testid={`skeleton-amount-${i}`} />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full" data-testid="skeleton-button" />
      </Card>
    )
  }

  const balances = initialData?.balances || []

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Outstanding Balances</h3>
        <button
          onClick={() => {/* To be implemented in routing phase */}}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all balances"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {balances.map((entry) => (
          <div 
            key={entry.memberId}
            className="flex items-center justify-between"
          >
            <span className="font-medium">{entry.memberName}</span>
            <span className={entry.amount > 0 ? "text-destructive" : "text-green-600"}>
              {entry.amount > 0 ? "owes " : "receives "}
              {formatCurrency(Math.abs(entry.amount))}
            </span>
          </div>
        ))}
        {balances.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">No outstanding balances</p>
        )}
      </div>
    </Card>
  )
} 