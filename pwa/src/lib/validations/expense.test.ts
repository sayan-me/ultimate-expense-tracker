import { describe, it, expect, beforeEach } from 'vitest'
import { expenseSchema, formatAmount } from './expense'
import { usePreferencesStore } from '@/stores/preferences'

function validRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amount: 10,
    type: 'expense' as const,
    category: 'Food',
    description: '',
    accountId: 1,
    date: new Date('2026-11-05T12:00:00'),
    tags: [],
    ...overrides,
  }
}

describe('expenseSchema date field', () => {
  it('accepts a normal present-day date', () => {
    const result = expenseSchema.safeParse(validRecord({ date: new Date('2026-11-05T12:00:00') }))
    expect(result.success).toBe(true)
  })

  it('rejects a future date', () => {
    const farFuture = new Date()
    farFuture.setFullYear(farFuture.getFullYear() + 1)
    const result = expenseSchema.safeParse(validRecord({ date: farFuture }))
    expect(result.success).toBe(false)
  })

  // A1 in the real-user test report: typing "11/12/0026" into the date
  // picker (a missing-digit typo for 2026) was silently accepted, and the
  // resulting transaction then disagreed with the dashboard's totals
  // (Total Balance included it, Monthly Spend/Recent Transactions didn't,
  // since they filter/sort by date and a year-26 date sorts far in the
  // past). The fix is a floor on how far back a date can be.
  it('rejects a date with an implausibly early year (e.g. a missing-digit year typo)', () => {
    const result = expenseSchema.safeParse(validRecord({ date: new Date('0026-11-12T12:00:00') }))
    expect(result.success).toBe(false)
  })

  it('accepts a genuinely old but plausible date (e.g. backdating a 2015 transaction)', () => {
    const result = expenseSchema.safeParse(validRecord({ date: new Date('2015-01-01T00:00:00') }))
    expect(result.success).toBe(true)
  })

  it('accepts today exactly at the boundary (end of day)', () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const result = expenseSchema.safeParse(validRecord({ date: today }))
    expect(result.success).toBe(true)
  })
})

describe('formatAmount', () => {
  beforeEach(() => {
    // Like formatCents() in lib/money.ts, formatAmount() reads the active
    // currency from the preferences store directly rather than via the
    // hook, since it's a plain utility used in a non-component (Zod
    // validation) context. Reset between tests so one test's currency
    // change doesn't leak into the next.
    usePreferencesStore.setState({ currency: 'USD' })
  })

  it('formats a dollar amount as USD currency by default', () => {
    expect(formatAmount(1000000)).toBe('$1,000,000.00')
  })

  it('formats using the active currency from the preferences store', () => {
    usePreferencesStore.getState().setCurrency('INR')
    expect(formatAmount(1000000)).toBe('₹1,000,000.00')
  })
})
