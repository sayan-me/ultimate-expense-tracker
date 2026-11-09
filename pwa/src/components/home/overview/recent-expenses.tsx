"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCents } from "@/lib/money"
import { format } from "date-fns"
import { ArrowRight, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDB } from "@/contexts/db-context"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"
import { isExpenseOrIncomeTransaction, type Transaction } from "@/lib/db"
import { isOutflow } from "@/lib/account-balance"

export function RecentExpenses() {
  const { transactions, categories } = useDB()
  const router = useRouter()
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { type: "expense" | "income" }) | null>(null)

  // Get recent transactions (limit to 5)
  const recentTransactions = transactions.useRecentTransactions(5)

  const goToHistory = () => router.push("/history")

  // U5 (bug report): the category dot was colored by transaction type
  // (always red for an expense), not by the category's own stored
  // color. Look it up by name.
  const categoryColor = (categoryName: string, fallback: string) =>
    categories.categories?.find((c) => c.name === categoryName)?.color ?? fallback

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
            onClick={goToHistory}
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
          onClick={goToHistory}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="View all transactions"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y">
        {recentTransactions.map((transaction) => {
          const editable = isExpenseOrIncomeTransaction(transaction)
          const outflow = isOutflow(transaction.type)
          const content = (
            <>
              <div className="space-y-1 min-w-0">
                <p className="font-medium truncate">{transaction.description || transaction.category}</p>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: categoryColor(transaction.category, outflow ? '#ef4444' : '#10b981')
                      }}
                    />
                    {transaction.category}
                  </span>
                  <span className="whitespace-nowrap">•</span>
                  <time dateTime={transaction.date.toISOString()} className="whitespace-nowrap">
                    {format(transaction.date, "MMM d, h:mm a")}
                  </time>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-medium whitespace-nowrap ${outflow ? 'text-red-600' : 'text-green-600'}`}>
                  {outflow ? '-' : '+'}
                  {formatCents(transaction.amount)}
                </p>
                {transaction.tags && transaction.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.tags.join(', ')}
                  </p>
                )}
              </div>
            </>
          )

          // A transfer leg isn't edited through the ordinary expense form
          // (see AddExpenseForm) — it's a linked pair, not a standalone row.
          if (!editable) {
            return (
              <div
                key={transaction.id}
                className="flex w-full items-center gap-3 justify-between p-4"
              >
                {content}
              </div>
            )
          }

          return (
            <button
              key={transaction.id}
              type="button"
              onClick={() => setEditingTransaction(transaction)}
              className="flex w-full items-center gap-3 justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              aria-label={`Edit ${transaction.description || transaction.category}`}
            >
              {content}
            </button>
          )
        })}
      </div>
      {editingTransaction && (
        <AddExpenseModal
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}
    </div>
  )
} 