"use client"

import { formatAmount } from "@/lib/validations/expense"
import { format } from "date-fns"
import { ArrowRight, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDB } from "@/contexts/db-context"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"

export function RecentExpenses() {
  const { transactions } = useDB()
  
  // Get recent transactions (limit to 5)
  const recentTransactions = transactions.useRecentTransactions(5)

  if (!recentTransactions) {
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

  if (recentTransactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Transactions</h3>
          <button
            onClick={() => {/* To be implemented in routing phase */}}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View all transactions"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-sm mb-1">No transactions yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding your first expense or income
          </p>
          <AddExpenseModal
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Add Transaction
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Transactions</h3>
        <button
          onClick={() => {/* To be implemented in routing phase */}}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all transactions"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y">
        {recentTransactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <p className="font-medium">{transaction.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      backgroundColor: transaction.type === 'expense' ? '#ef4444' : '#10b981' 
                    }}
                  />
                  {transaction.category}
                </span>
                <span>•</span>
                <time dateTime={transaction.date.toISOString()}>
                  {format(transaction.date, "MMM d, h:mm a")}
                </time>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-medium ${
                transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatAmount(transaction.amount)}
              </p>
              {transaction.tags && transaction.tags.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {transaction.tags.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 