import type { Transaction, Category } from "./db"

export interface MonthFilter {
  month: number // 0-indexed, matches Date.getMonth()
  year: number
}

export interface MonthSummary {
  income: number
  expense: number
  net: number
}

const DEFAULT_CATEGORY_COLOR = "#6b7280"

const inMonth = (date: Date, filter: MonthFilter) =>
  date.getFullYear() === filter.year && date.getMonth() === filter.month

/** Income/expense/net totals (cents) for the given month. Transfers are never income or expense. */
export function computeMonthSummary(transactions: Transaction[], filter: MonthFilter): MonthSummary {
  const inRange = transactions.filter((t) => inMonth(t.date, filter))
  const income = inRange.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const expense = inRange.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  return { income, expense, net: income - expense }
}

export interface CategoryBreakdownEntry {
  category: string
  amount: number
  color: string
}

/** Expense totals (cents) per category for the given month, sorted highest spend first. */
export function computeCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  filter: MonthFilter
): CategoryBreakdownEntry[] {
  const colorByCategory = new Map(categories.map((c) => [c.name, c.color]))
  const totals = new Map<string, number>()

  for (const t of transactions) {
    if (t.type !== "expense" || !inMonth(t.date, filter)) continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount, color: colorByCategory.get(category) ?? DEFAULT_CATEGORY_COLOR }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthlyTotal extends MonthSummary {
  month: number
  year: number
}

/** Income/expense totals for the `monthsBack` months ending at `referenceDate`'s month, oldest first. */
export function computeMonthlyTrend(
  transactions: Transaction[],
  monthsBack: number,
  referenceDate: Date = new Date()
): MonthlyTotal[] {
  const result: MonthlyTotal[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1)
    const filter = { month: d.getMonth(), year: d.getFullYear() }
    const { income, expense, net } = computeMonthSummary(transactions, filter)
    result.push({ ...filter, income, expense, net })
  }
  return result
}
