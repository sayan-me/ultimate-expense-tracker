import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StatsPage from './page'
import type { Transaction } from '@/lib/db'

let mockTransactions: Transaction[]
let mockCategories: { name: string; color: string }[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { transactions: mockTransactions },
    categories: { categories: mockCategories },
  }),
}))

function expense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    type: 'expense',
    amount: 2000,
    category: 'Food & Dining',
    description: '',
    date: new Date(2026, 9, 15),
    accountId: 1,
    createdAt: new Date(2026, 9, 15),
    updatedAt: new Date(2026, 9, 15),
    ...overrides,
  }
}

describe('StatsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 20)) // "today" is Oct 20, 2026
    mockTransactions = []
    mockCategories = [{ name: 'Food & Dining', color: '#ef4444' }]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the page title and defaults to the current month', () => {
    render(<StatsPage />)
    expect(screen.getByRole('heading', { name: 'Stats', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('October 2026')).toBeInTheDocument()
  })

  it('shows income, expense, and net for the selected month', () => {
    mockTransactions = [
      expense({ type: 'income', amount: 100000, date: new Date(2026, 9, 1) }),
      expense({ amount: 30000, date: new Date(2026, 9, 2) }),
    ]
    render(<StatsPage />)
    const summary = within(screen.getByTestId('month-summary'))
    expect(summary.getByText('$1,000.00')).toBeInTheDocument()
    expect(summary.getByText('$300.00')).toBeInTheDocument()
    expect(summary.getByText('$700.00')).toBeInTheDocument()
  })

  it('shows the category split for the selected month', () => {
    mockTransactions = [expense({ category: 'Food & Dining', amount: 1500, date: new Date(2026, 9, 2) })]
    render(<StatsPage />)
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
  })

  it('navigates to the previous month', async () => {
    const user = userEvent.setup({ delay: null })
    render(<StatsPage />)
    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })

  it('does not allow navigating past the current month', async () => {
    const user = userEvent.setup({ delay: null })
    render(<StatsPage />)
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('October 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled()
  })

  it('shows the 6-month income/expense trend', () => {
    mockTransactions = [expense({ type: 'income', amount: 5000, date: new Date(2026, 9, 2) })]
    render(<StatsPage />)
    expect(screen.getAllByText('Income').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Expense').length).toBeGreaterThan(0)
  })
})
