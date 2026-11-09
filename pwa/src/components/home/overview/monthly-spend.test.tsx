import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySpend } from './monthly-spend'

type MockDB = {
  transactions: { transactions?: Array<{ type: 'income' | 'expense'; amount: number; date: Date }> }
}

let mockDB: MockDB

vi.mock('@/contexts/db-context', () => ({
  useDB: () => mockDB,
}))

describe('MonthlySpend', () => {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)

  const loaded = (): MockDB => ({
    transactions: {
      transactions: [
        { type: 'expense', amount: 1200, date: now },
        { type: 'income', amount: 3000, date: now }, // income must not count as spend
        { type: 'expense', amount: 500, date: lastMonth }, // previous month must not count
      ],
    },
  })

  it('shows loading skeletons while data is undefined', () => {
    mockDB = { transactions: { transactions: undefined } }
    render(<MonthlySpend />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.queryByText('Monthly Spend vs Budget')).not.toBeInTheDocument()
  })

  it('renders monthly spend section once loaded', () => {
    mockDB = loaded()
    render(<MonthlySpend />)
    expect(screen.getByText('Monthly Spend vs Budget')).toBeInTheDocument()
  })

  it('sums only this month\'s expenses, ignoring income and other months', () => {
    mockDB = loaded()
    render(<MonthlySpend />)
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
  })

  it('shows percentage used against the budget', () => {
    mockDB = loaded()
    render(<MonthlySpend />)
    // 1200 / 4000 placeholder budget = 30%
    expect(screen.getByText('30% used')).toBeInTheDocument()
  })

  it('updates live as transactions change, without a reload', () => {
    mockDB = loaded()
    const { rerender } = render(<MonthlySpend />)
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()

    mockDB = {
      transactions: {
        transactions: [
          ...mockDB.transactions.transactions!,
          { type: 'expense', amount: 12, date: now },
        ],
      },
    }
    rerender(<MonthlySpend />)
    expect(screen.getByText('$1,212.00')).toBeInTheDocument()
  })
})
