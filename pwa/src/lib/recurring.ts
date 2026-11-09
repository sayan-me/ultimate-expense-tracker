import { addDays, addWeeks, addMonths } from "date-fns"
import type { RecurringTransaction, Transaction } from "./db"

export type RecurringFrequency = RecurringTransaction["frequency"]

export function nextOccurrence(date: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, 1)
    case "weekly":
      return addWeeks(date, 1)
    case "monthly":
      return addMonths(date, 1)
  }
}

// A single run materializes at most this many catch-up occurrences — a
// defensive bound, not an expected case. Without it, a stale nextRunDate
// (e.g. a bug, or a daily recurrence left dormant for years) would build an
// unbounded array in one pass; this just spreads the catch-up over
// multiple runs instead of however many occurrences are actually due.
const MAX_OCCURRENCES_PER_RUN = 1000

export interface MaterializeResult {
  transactions: Omit<Transaction, "id" | "createdAt" | "updatedAt">[]
  nextRunDate: Date
}

/**
 * Turns a recurring transaction's overdue occurrences (nextRunDate through
 * asOf) into real transaction rows, advancing nextRunDate past each one
 * produced. Pure — the caller is responsible for persisting the result.
 */
export function materializeDueRecurring(recurring: RecurringTransaction, asOf: Date): MaterializeResult {
  if (!recurring.isActive) {
    return { transactions: [], nextRunDate: recurring.nextRunDate }
  }

  const transactions: Omit<Transaction, "id" | "createdAt" | "updatedAt">[] = []
  let runDate = recurring.nextRunDate

  while (runDate.getTime() <= asOf.getTime() && transactions.length < MAX_OCCURRENCES_PER_RUN) {
    transactions.push({
      accountId: recurring.accountId,
      type: recurring.type,
      category: recurring.category,
      description: recurring.description,
      amount: recurring.amount,
      date: runDate,
    })
    runDate = nextOccurrence(runDate, recurring.frequency)
  }

  return { transactions, nextRunDate: runDate }
}
