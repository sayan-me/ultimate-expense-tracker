import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySpend } from './monthly-spend'

type MockDB = {
  transactions: { transactions?: Array<{ type: 'income' | 'expense'; amount: number; date: Date }> }
  budgets: { useOverallBudget: () => { amount: number } | undefined }
}

let mockDB: MockDB

vi.mock('@/contexts/db-context', () => ({
  useDB: () => mockDB,
}))

describe('MonthlySpend', () => {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)

  // Amounts are in cents. budgetAmount must always be passed explicitly —
  // a default parameter would silently kick in for loaded(undefined) too,
  // defeating the "no budget set" test case.
  const loaded = (budgetAmount: number | undefined): MockDB => ({
    transactions: {
      transactions: [
        { type: 'expense', amount: 120000, date: now }, // $1,200.00
        { type: 'income', amount: 300000, date: now }, // income must not count as spend
        { type: 'expense', amount: 50000, date: lastMonth }, // previous month must not count
      ],
    },
    budgets: {
      useOverallBudget: () => (budgetAmount === undefined ? undefined : { amount: budgetAmount }),
    },
  })

  it('shows loading skeletons while data is undefined', () => {
    mockDB = {
      transactions: { transactions: undefined },
      budgets: { useOverallBudget: () => undefined },
    }
    render(<MonthlySpend />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.queryByText('Monthly Spend vs Budget')).not.toBeInTheDocument()
  })

  it('renders monthly spend section once loaded', () => {
    mockDB = loaded(400000)
    render(<MonthlySpend />)
    expect(screen.getByText('Monthly Spend vs Budget')).toBeInTheDocument()
  })

  it('sums only this month\'s expenses, ignoring income and other months', () => {
    mockDB = loaded(400000)
    render(<MonthlySpend />)
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
  })

  it('shows percentage used against the real budget', () => {
    mockDB = loaded(400000)
    render(<MonthlySpend />)
    // 120000 / 400000 budget (cents) = 30%
    expect(screen.getByText('30% used')).toBeInTheDocument()
  })

  it('updates live as transactions change, without a reload', () => {
    mockDB = loaded(400000)
    const { rerender } = render(<MonthlySpend />)
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()

    mockDB = {
      ...mockDB,
      transactions: {
        transactions: [
          ...mockDB.transactions.transactions!,
          { type: 'expense', amount: 1200, date: now }, // +$12.00
        ],
      },
    }
    rerender(<MonthlySpend />)
    expect(screen.getByText('$1,212.00')).toBeInTheDocument()
  })

  it('shows a "set a budget" prompt instead of a progress bar when no overall budget is set', () => {
    mockDB = loaded(undefined)
    render(<MonthlySpend />)
    expect(screen.getByRole('link', { name: /set a budget/i })).toBeInTheDocument()
    expect(screen.queryByText(/% used/)).not.toBeInTheDocument()
  })

  it('shows a warning state at 80% or more of budget used', () => {
    mockDB = loaded(150000) // 120000 / 150000 = 80%
    render(<MonthlySpend />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-level', 'warning')
  })

  it('shows an over-budget state at 100% or more of budget used', () => {
    mockDB = loaded(100000) // 120000 / 100000 = 120%
    render(<MonthlySpend />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-level', 'over')
  })

  it('shows an ok state below 80% of budget used', () => {
    mockDB = loaded(400000) // 120000 / 400000 = 30%
    render(<MonthlySpend />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-level', 'ok')
  })
})
