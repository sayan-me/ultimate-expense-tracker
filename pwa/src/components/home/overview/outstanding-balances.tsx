"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState, useEffect } from "react"
import { getOutstandingBalances } from "@/lib/data"

interface BalanceEntry {
  memberId: string
  memberName: string
  amount: number
  owesTo: string
}

export function OutstandingBalances() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<{
    balances: BalanceEntry[]
  } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getOutstandingBalances()
        setData(result)
      } catch (err) {
        console.error('Outstanding balances fetch error:', err)
        setError(err instanceof Error ? err : new Error('Failed to load balances'))
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
        <span>Failed to load balances: {error.message}</span>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  try {
    const balances = data?.balances ?? []

    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Outstanding Balances</h3>
            <button
              onClick={() => {
                try {
                  throw new Error("Detailed view not implemented yet")
                } catch (err) {
                  setError(err instanceof Error ? err : new Error("Unknown error"))
                }
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="View all balances"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Member</span>
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-muted-foreground">Settlement</span>
            </div>

            <div className="space-y-2">
              {balances.map((balance) => (
                <div 
                  key={balance.memberId}
                  className="grid grid-cols-3 gap-4 py-1"
                >
                  <span className="text-sm">{balance.memberName}</span>
                  <span 
                    className={`text-sm font-medium ${
                      balance.amount > 0 
                        ? 'text-red-500' 
                        : balance.amount < 0 
                          ? 'text-green-500' 
                          : ''
                    }`}
                  >
                    {balance.amount > 0 
                      ? `${formatCurrency(balance.amount)}` 
                      : balance.amount < 0 
                        ? `${formatCurrency(Math.abs(balance.amount))}` 
                        : '₹0.00'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {balance.amount > 0 
                      ? `Owes to ${balance.owesTo}` 
                      : balance.amount < 0 
                        ? `Gets from ${balance.owesTo}` 
                        : 'Settled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to render balances"))
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Something went wrong</span>
      </Alert>
    )
  }
} 