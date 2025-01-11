"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, ChevronRight, PieChart } from "lucide-react"
import { useState } from "react"

interface GroupStatsProps {
  isLoading?: boolean
  initialData?: {
    totalSpending?: number
    monthlyBudget?: number
    categories: {
      name: string
      amount: number
    }[]
  }
}

export function GroupStats({ isLoading = false, initialData }: GroupStatsProps) {
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Failed to load group stats: {error.message}</span>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  try {
    return (
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Group Stats</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${initialData?.totalSpending || 0}
            </span>
            <span className="text-sm text-muted-foreground">
              of ${initialData?.monthlyBudget || 0} budget
            </span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ 
                width: `${Math.min(
                  ((initialData?.totalSpending || 0) / 
                  (initialData?.monthlyBudget || 1)) * 100, 
                  100
                )}%` 
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={initialData?.monthlyBudget || 0}
              aria-valuenow={initialData?.totalSpending || 0}
            />
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-between"
          aria-label="View category-wise spending"
          onClick={() => {
            try {
              // Category view handler will be implemented in Phase 2
              // For now, just prevent unimplemented action errors
              throw new Error("Category view not implemented yet")
            } catch (err) {
              setError(err instanceof Error ? err : new Error("Unknown error"))
            }
          }}
        >
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>View by Category</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    )
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Failed to render group stats"))
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Something went wrong</span>
      </Alert>
    )
  }
} 