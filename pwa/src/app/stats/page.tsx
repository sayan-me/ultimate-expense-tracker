"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatCents } from "@/lib/money"
import { computeMonthSummary, computeCategoryBreakdown, computeMonthlyTrend } from "@/lib/stats"
import { useDB } from "@/contexts/db-context"
import { CategorySplitBar } from "@/components/stats/category-split-bar"
import { MonthlyTrendChart } from "@/components/stats/monthly-trend-chart"

const TREND_MONTHS = 6

export default function StatsPage() {
  const { transactions, categories } = useDB()
  const allTransactions = transactions.transactions ?? []
  const allCategories = categories.categories ?? []

  const now = new Date()
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const isCurrentMonth = cursor.getFullYear() === now.getFullYear() && cursor.getMonth() === now.getMonth()
  const filter = { month: cursor.getMonth(), year: cursor.getFullYear() }

  const goToPreviousMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  const goToNextMonth = () => {
    if (isCurrentMonth) return
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }

  const summary = computeMonthSummary(allTransactions, filter)
  const breakdown = computeCategoryBreakdown(allTransactions, allCategories, filter)
  const trend = computeMonthlyTrend(allTransactions, TREND_MONTHS, cursor)

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold">Stats</h1>

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

      <div className="grid grid-cols-3 gap-3" data-testid="month-summary">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-lg font-semibold tabular-nums text-green-600">{formatCents(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Expense</p>
            <p className="text-lg font-semibold tabular-nums text-red-600">{formatCents(summary.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className={`text-lg font-semibold tabular-nums ${summary.net >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCents(summary.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategorySplitBar entries={breakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income vs Expense, Last {TREND_MONTHS} Months</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart months={trend} />
        </CardContent>
      </Card>
    </div>
  )
}
