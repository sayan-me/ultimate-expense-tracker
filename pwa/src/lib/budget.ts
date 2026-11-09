import type { Transaction } from "./db"

export interface SpendFilter {
  month: number // 0-indexed, matches Date.getMonth()
  year: number
  /** Omit for the overall (all-category) budget. */
  category?: string
}

/** Sum of expense amounts (cents) matching the given month/year and, optionally, category. Income is never counted as spend. */
export function computeSpend(transactions: Transaction[], filter: SpendFilter): number {
  return transactions
    .filter((t) => t.type === "expense")
    .filter((t) => t.date.getFullYear() === filter.year && t.date.getMonth() === filter.month)
    .filter((t) => filter.category === undefined || t.category === filter.category)
    .reduce((sum, t) => sum + t.amount, 0)
}

export type BudgetLevel = "ok" | "warning" | "over"

export interface BudgetStatus {
  percentage: number
  level: BudgetLevel
}

/**
 * ok below 80% used, warning from 80% up to (not including) 100%, over at
 * 100% and beyond. A zero budget with zero spend is "ok" at 0% rather than
 * NaN; a zero budget with any spend is instantly "over" (percentage is
 * +Infinity — callers display that as "over budget" rather than a number).
 */
export function budgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget === 0) {
    return spent === 0 ? { percentage: 0, level: "ok" } : { percentage: Infinity, level: "over" }
  }
  const percentage = (spent / budget) * 100
  const level: BudgetLevel = percentage >= 100 ? "over" : percentage >= 80 ? "warning" : "ok"
  return { percentage, level }
}
