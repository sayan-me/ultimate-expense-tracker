"use client"

import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentBalance } from "@/lib/data"
import { useEffect, useState } from "react"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function CurrentBalance() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getCurrentBalance()
        setBalance(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load balance'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load balance: {error.message}</span>
      </Alert>
    )
  }

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
      <p className="mt-2 text-3xl font-bold">{formatCurrency(balance ?? 0)}</p>
      <div className="mt-4 flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Across all accounts
        </div>
      </div>
    </div>
  )
} 