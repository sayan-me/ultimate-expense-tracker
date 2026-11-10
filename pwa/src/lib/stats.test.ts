import { describe, it, expect } from 'vitest'
import { computeMonthSummary, computeCategoryBreakdown, computeMonthlyTrend } from './stats'
import type { Transaction, Category } from './db'

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    amount: 1000,
    type: 'expense',
    category: 'Food & Dining',
    description: '',
    date: new Date(2026, 9, 15),
    accountId: 1,
    createdAt: new Date(2026, 9, 15),
    updatedAt: new Date(2026, 9, 15),
    ...overrides,
  }
}

function category(overrides: Partial<Category> = {}): Category {
  return { id: 1, name: 'Food & Dining', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense', createdAt: new Date(), ...overrides }
}

describe('computeMonthSummary', () => {
  it('sums income, expense, and computes net for the given month', () => {
    const transactions = [
      tx({ type: 'expense', amount: 3000, date: new Date(2026, 9, 1) }),
      tx({ type: 'income', amount: 10000, date: new Date(2026, 9, 2) }),
      tx({ type: 'expense', amount: 2000, date: new Date(2026, 9, 3) }),
    ]
    const summary = computeMonthSummary(transactions, { month: 9, year: 2026 })
    expect(summary).toEqual({ income: 10000, expense: 5000, net: 5000 })
  })

  it('excludes transfers from income and expense', () => {
    const transactions = [
      tx({ type: 'transfer_out', amount: 5000, date: new Date(2026, 9, 1) }),
      tx({ type: 'transfer_in', amount: 5000, date: new Date(2026, 9, 1) }),
      tx({ type: 'expense', amount: 1000, date: new Date(2026, 9, 1) }),
    ]
    const summary = computeMonthSummary(transactions, { month: 9, year: 2026 })
    expect(summary).toEqual({ income: 0, expense: 1000, net: -1000 })
  })

  it('ignores transactions outside the given month', () => {
    const transactions = [tx({ type: 'expense', amount: 1000, date: new Date(2026, 8, 30) })]
    const summary = computeMonthSummary(transactions, { month: 9, year: 2026 })
    expect(summary).toEqual({ income: 0, expense: 0, net: 0 })
  })
})

describe('computeCategoryBreakdown', () => {
  it('sums expense amounts per category for the given month, with each category\'s color', () => {
    const transactions = [
      tx({ category: 'Food & Dining', amount: 3000, date: new Date(2026, 9, 1) }),
      tx({ category: 'Food & Dining', amount: 2000, date: new Date(2026, 9, 2) }),
      tx({ category: 'Transportation', amount: 1500, date: new Date(2026, 9, 3) }),
    ]
    const categories = [category({ name: 'Food & Dining', color: '#ef4444' }), category({ name: 'Transportation', color: '#3b82f6' })]
    const breakdown = computeCategoryBreakdown(transactions, categories, { month: 9, year: 2026 })

    expect(breakdown).toEqual([
      { category: 'Food & Dining', amount: 5000, color: '#ef4444' },
      { category: 'Transportation', amount: 1500, color: '#3b82f6' },
    ])
  })

  it('sorts categories by amount descending', () => {
    const transactions = [
      tx({ category: 'Transportation', amount: 1000, date: new Date(2026, 9, 1) }),
      tx({ category: 'Food & Dining', amount: 5000, date: new Date(2026, 9, 1) }),
    ]
    const categories = [category({ name: 'Food & Dining' }), category({ name: 'Transportation' })]
    const breakdown = computeCategoryBreakdown(transactions, categories, { month: 9, year: 2026 })
    expect(breakdown.map((b) => b.category)).toEqual(['Food & Dining', 'Transportation'])
  })

  it('excludes income and transfers, and categories with zero spend', () => {
    const transactions = [
      tx({ category: 'Salary', type: 'income', amount: 5000, date: new Date(2026, 9, 1) }),
      tx({ category: 'Food & Dining', amount: 1000, date: new Date(2026, 9, 1) }),
    ]
    const categories = [category({ name: 'Food & Dining' }), category({ name: 'Entertainment', color: '#8b5cf6' })]
    const breakdown = computeCategoryBreakdown(transactions, categories, { month: 9, year: 2026 })
    expect(breakdown).toEqual([{ category: 'Food & Dining', amount: 1000, color: '#ef4444' }])
  })

  it('falls back to a default color for a category not in the categories list (e.g. deleted since)', () => {
    const transactions = [tx({ category: 'Old Category', amount: 1000, date: new Date(2026, 9, 1) })]
    const breakdown = computeCategoryBreakdown(transactions, [], { month: 9, year: 2026 })
    expect(breakdown).toEqual([{ category: 'Old Category', amount: 1000, color: '#6b7280' }])
  })
})

describe('computeMonthlyTrend', () => {
  it('returns income/expense totals for the last N months, oldest first, including the reference month', () => {
    const transactions = [
      tx({ type: 'expense', amount: 1000, date: new Date(2026, 8, 5) }),
      tx({ type: 'income', amount: 9000, date: new Date(2026, 8, 5) }),
      tx({ type: 'expense', amount: 2000, date: new Date(2026, 9, 5) }),
    ]
    const trend = computeMonthlyTrend(transactions, 3, new Date(2026, 9, 15))

    expect(trend).toEqual([
      { month: 7, year: 2026, income: 0, expense: 0, net: 0 },
      { month: 8, year: 2026, income: 9000, expense: 1000, net: 8000 },
      { month: 9, year: 2026, income: 0, expense: 2000, net: -2000 },
    ])
  })

  it('correctly spans a year boundary', () => {
    const transactions = [tx({ type: 'expense', amount: 500, date: new Date(2025, 11, 20) })]
    const trend = computeMonthlyTrend(transactions, 3, new Date(2026, 0, 10))

    expect(trend).toEqual([
      { month: 10, year: 2025, income: 0, expense: 0, net: 0 },
      { month: 11, year: 2025, income: 0, expense: 500, net: -500 },
      { month: 0, year: 2026, income: 0, expense: 0, net: 0 },
    ])
  })
})
