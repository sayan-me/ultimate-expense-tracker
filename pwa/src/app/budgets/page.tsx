"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCents, dollarsToCents } from "@/lib/money"
import { useCurrencySymbol } from "@/stores/preferences"
import { computeSpend, budgetStatus } from "@/lib/budget"
import { useDB } from "@/contexts/db-context"

const LEVEL_COLOR = {
  ok: "bg-primary",
  warning: "bg-warning",
  over: "bg-destructive",
} as const

function BudgetProgress({ spent, budgetAmount }: { spent: number; budgetAmount: number }) {
  const { percentage, level } = budgetStatus(spent, budgetAmount)
  const displayPercentage = Number.isFinite(percentage) ? percentage : 999
  return (
    <div className="space-y-1.5 mt-2">
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
      <p className="text-xs text-muted-foreground text-right">{displayPercentage.toFixed(0)}% used</p>
    </div>
  )
}

function BudgetEditor({
  label,
  inputLabel,
  saveLabel,
  clearLabel,
  currentAmount,
  onSave,
  onClear,
}: {
  label: string
  inputLabel: string
  saveLabel: string
  clearLabel: string
  currentAmount: number | undefined
  onSave: (dollars: number) => void
  onClear: () => void
}) {
  const currencySymbol = useCurrencySymbol()
  const [value, setValue] = useState(currentAmount !== undefined ? String(currentAmount / 100) : "")

  const handleSave = () => {
    const dollars = parseFloat(value)
    if (isNaN(dollars) || dollars <= 0) return
    onSave(dollars)
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor={`budget-${label}`}>{inputLabel}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
          <Input
            id={`budget-${label}`}
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount..."
            className="pl-8"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>
      <Button type="button" onClick={handleSave} aria-label={saveLabel}>
        Save
      </Button>
      {currentAmount !== undefined && (
        <Button type="button" variant="outline" size="icon" onClick={onClear} aria-label={clearLabel}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function BudgetsPage() {
  const { transactions, categories, budgets } = useDB()
  const now = new Date()
  const spendFilter = { month: now.getMonth(), year: now.getFullYear() }
  const allTransactions = transactions.transactions ?? []

  const overallBudget = budgets.useOverallBudget()
  const overallSpend = computeSpend(allTransactions, spendFilter)

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold">Budgets</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetEditor
            label="overall"
            inputLabel="Overall monthly budget"
            saveLabel="Save overall budget"
            clearLabel="Clear overall budget"
            currentAmount={overallBudget?.amount}
            onSave={(dollars) => budgets.setBudget(null, dollarsToCents(dollars))}
            onClear={() => overallBudget?.id !== undefined && budgets.deleteBudget(overallBudget.id)}
          />
          {overallBudget && <BudgetProgress spent={overallSpend} budgetAmount={overallBudget.amount} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Budgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(categories.categories ?? []).map((category) => (
            <CategoryBudgetRow
              key={category.id}
              categoryName={category.name}
              transactions={allTransactions}
              spendFilter={spendFilter}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function CategoryBudgetRow({
  categoryName,
  transactions,
  spendFilter,
}: {
  categoryName: string
  transactions: ReturnType<typeof useDB>["transactions"]["transactions"]
  spendFilter: { month: number; year: number }
}) {
  const { budgets } = useDB()
  const categoryBudget = budgets.useCategoryBudget(categoryName)
  const spend = computeSpend(transactions ?? [], { ...spendFilter, category: categoryName })

  return (
    <div>
      <p className="font-medium">{categoryName}</p>
      <BudgetEditor
        label={categoryName}
        inputLabel={`Budget for ${categoryName}`}
        saveLabel={`Save budget for ${categoryName}`}
        clearLabel={`Clear budget for ${categoryName}`}
        currentAmount={categoryBudget?.amount}
        onSave={(dollars) => budgets.setBudget(categoryName, dollarsToCents(dollars))}
        onClear={() => categoryBudget?.id !== undefined && budgets.deleteBudget(categoryBudget.id)}
      />
      {categoryBudget && <BudgetProgress spent={spend} budgetAmount={categoryBudget.amount} />}
    </div>
  )
}
