"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCents } from "@/lib/money"
import { computeSpend, budgetStatus } from "@/lib/budget"
import { useDB } from "@/contexts/db-context"

const LEVEL_COLOR = {
  ok: "bg-primary",
  warning: "bg-warning",
  over: "bg-destructive",
} as const

function MonthSpendRow({ label, spent, budgetAmount }: { label: string; spent: number; budgetAmount: number }) {
  const { percentage, level } = budgetStatus(spent, budgetAmount)
  const displayPercentage = Number.isFinite(percentage) ? percentage : 999
  return (
    <div className="space-y-1.5">
      <p className="font-medium">{label}</p>
      <div className="flex items-center justify-between text-sm">
        <span>{formatCents(spent)} spent</span>
        <span className="text-muted-foreground">of {formatCents(budgetAmount)}</span>
      </div>
      <Progress
        value={Math.min(displayPercentage, 100)}
        className="h-2"
        indicatorClassName={cn(LEVEL_COLOR[level])}
        data-level={level}
      />
    </div>
  )
}

export default function BudgetHistoryPage() {
  const { transactions, budgets } = useDB()
  const allTransactions = transactions.transactions ?? []
  const allBudgets = budgets.budgets ?? []
  const overallBudget = allBudgets.find((b) => b.category === null)
  const categoryBudgets = allBudgets.filter((b): b is typeof b & { category: string } => b.category !== null)

  const now = new Date()
  // History defaults to looking back, not at the still-in-progress current month.
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const isCurrentMonth = cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
  const spendFilter = { month: cursor.getMonth(), year: cursor.getFullYear() }

  const goToPreviousMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goToNextMonth = () => {
    if (isCurrentMonth) return
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold">Budget History</h1>
      <p className="text-sm text-muted-foreground">
        Budgets aren&apos;t tracked per month, so past months are shown against your current budget amount, not
        whatever it may have been back then.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Button type="button" variant="outline" size="icon" aria-label="Previous month" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-medium w-36 text-center">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next month"
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall</CardTitle>
        </CardHeader>
        <CardContent>
          {overallBudget ? (
            <MonthSpendRow
              label="All categories"
              spent={computeSpend(allTransactions, spendFilter)}
              budgetAmount={overallBudget.amount}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No overall budget is set.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category budgets are set.</p>
          ) : (
            categoryBudgets.map((budget) => (
              <MonthSpendRow
                key={budget.id}
                label={budget.category}
                spent={computeSpend(allTransactions, { ...spendFilter, category: budget.category })}
                budgetAmount={budget.amount}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
