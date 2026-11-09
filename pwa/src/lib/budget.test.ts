import { describe, it, expect } from 'vitest'
import { computeSpend, budgetStatus } from './budget'
import type { Transaction } from './db'

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    amount: 1000,
    type: 'expense',
    category: 'Food',
    description: '',
    date: new Date('2026-11-05T12:00:00'),
    accountId: 1,
    createdAt: new Date('2026-11-05T12:00:00'),
    updatedAt: new Date('2026-11-05T12:00:00'),
    ...overrides,
  }
}

describe('computeSpend', () => {
  const month = 10 // November (0-indexed)
  const year = 2026

  it('returns 0 for no transactions', () => {
    expect(computeSpend([], { month, year })).toBe(0)
  })

  it('sums expenses within the target month and year', () => {
    const txs = [
      tx({ amount: 1000, date: new Date('2026-11-01T00:00:00') }),
      tx({ amount: 2000, date: new Date('2026-11-30T23:59:59') }),
    ]
    expect(computeSpend(txs, { month, year })).toBe(3000)
  })

  it('excludes transactions from a different month', () => {
    const txs = [tx({ amount: 1000, date: new Date('2026-10-31T23:59:59') })]
    expect(computeSpend(txs, { month, year })).toBe(0)
  })

  it('excludes transactions from a different year', () => {
    const txs = [tx({ amount: 1000, date: new Date('2025-11-15T12:00:00') })]
    expect(computeSpend(txs, { month, year })).toBe(0)
  })

  it('excludes income transactions', () => {
    const txs = [tx({ amount: 5000, type: 'income' })]
    expect(computeSpend(txs, { month, year })).toBe(0)
  })

  it('filters by category when given, excluding other categories', () => {
    const txs = [
      tx({ amount: 1000, category: 'Food' }),
      tx({ amount: 2000, category: 'Transportation' }),
    ]
    expect(computeSpend(txs, { month, year, category: 'Food' })).toBe(1000)
  })

  it('sums across all categories when no category filter is given', () => {
    const txs = [
      tx({ amount: 1000, category: 'Food' }),
      tx({ amount: 2000, category: 'Transportation' }),
    ]
    expect(computeSpend(txs, { month, year })).toBe(3000)
  })

  it('category matching is case-sensitive, exact', () => {
    const txs = [tx({ amount: 1000, category: 'food' })]
    expect(computeSpend(txs, { month, year, category: 'Food' })).toBe(0)
  })
})

describe('budgetStatus', () => {
  it('is "ok" below 80% used', () => {
    expect(budgetStatus(7900, 10000).level).toBe('ok')
    expect(budgetStatus(0, 10000).level).toBe('ok')
  })

  it('is "warning" from 80% up to (but not including) 100%', () => {
    expect(budgetStatus(8000, 10000).level).toBe('warning')
    expect(budgetStatus(9999, 10000).level).toBe('warning')
  })

  it('is "over" at exactly 100% and beyond', () => {
    expect(budgetStatus(10000, 10000).level).toBe('over')
    expect(budgetStatus(15000, 10000).level).toBe('over')
  })

  it('reports the percentage used, uncapped', () => {
    expect(budgetStatus(5000, 10000).percentage).toBe(50)
    expect(budgetStatus(15000, 10000).percentage).toBe(150)
  })

  it('treats a zero budget with zero spend as "ok" at 0%, not NaN/divide-by-zero', () => {
    const result = budgetStatus(0, 0)
    expect(result.level).toBe('ok')
    expect(result.percentage).toBe(0)
  })

  it('treats a zero budget with any spend as instantly "over"', () => {
    const result = budgetStatus(100, 0)
    expect(result.level).toBe('over')
    expect(Number.isFinite(result.percentage)).toBe(false) // unbounded — the UI caps display separately
  })
})
