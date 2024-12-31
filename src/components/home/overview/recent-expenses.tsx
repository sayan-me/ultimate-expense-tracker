"use client"

import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Expense = {
  id: string
  date: Date
  amount: number
  category: string
  description: string
}

// Temporary mock data - will be replaced with real data later
const MOCK_EXPENSES: Expense[] = [
  {
    id: "1",
    date: new Date(),
    amount: 42.50,
    category: "Food & Dining",
    description: "Lunch at Subway"
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000),
    amount: 120.00,
    category: "Transportation",
    description: "Fuel"
  },
  {
    id: "3",
    date: new Date(Date.now() - 172800000),
    amount: 85.99,
    category: "Shopping",
    description: "Amazon purchase"
  }
]

interface RecentExpensesProps {
  isLoading?: boolean
}

export function RecentExpenses({ isLoading = false }: RecentExpensesProps) {
  const handleViewAll = () => {
    // Will be implemented when we add routing
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <Skeleton className="h-4 w-28" data-testid="skeleton-title" />
          <Skeleton className="h-4 w-16" data-testid="skeleton-action" />
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" data-testid={`skeleton-description-${i}`} />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-20" data-testid={`skeleton-category-${i}`} />
                  <span>•</span>
                  <Skeleton className="h-3 w-24" data-testid={`skeleton-date-${i}`} />
                </div>
              </div>
              <Skeleton className="h-4 w-16" data-testid={`skeleton-amount-${i}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Expenses</h3>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all expenses"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y">
        {MOCK_EXPENSES.map((expense) => (
          <div 
            key={expense.id}
            className="flex items-center justify-between p-4"
          >
            <div className="space-y-1">
              <p className="font-medium">{expense.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{expense.category}</span>
                <span>•</span>
                <time dateTime={expense.date.toISOString()}>
                  {format(expense.date, "MMM d, h:mm a")}
                </time>
              </div>
            </div>
            <p className="font-medium">{formatCurrency(expense.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 