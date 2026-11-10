import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BudgetHistoryPage from './page'
import type { Transaction, Budget } from '@/lib/db'

let mockTransactions: Transaction[]
let mockBudgets: Budget[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { transactions: mockTransactions },
    budgets: { budgets: mockBudgets },
  }),
}))

function expense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    type: 'expense',
    amount: 2000,
    category: 'Food & Dining',
    description: '',
    date: new Date(2026, 9, 15), // October 2026
    accountId: 1,
    createdAt: new Date(2026, 9, 15),
    updatedAt: new Date(2026, 9, 15),
    syncId: 's1',
    ...overrides,
  }
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return { id: 1, category: null, amount: 50000, createdAt: new Date(), updatedAt: new Date(), syncId: 'b1', ...overrides }
}

describe('BudgetHistoryPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 10, 10)) // "today" is Nov 10, 2026
    mockTransactions = []
    mockBudgets = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the page title and defaults to last month', () => {
    render(<BudgetHistoryPage />)
    expect(screen.getByRole('heading', { name: 'Budget History', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('October 2026')).toBeInTheDocument()
  })

  it('shows spend against the current overall budget amount for the selected month', () => {
    mockBudgets = [budget({ amount: 50000 })]
    mockTransactions = [expense({ amount: 2000 }), expense({ amount: 3000 })]
    render(<BudgetHistoryPage />)
    expect(screen.getByText('$50.00 spent')).toBeInTheDocument()
    expect(screen.getByText(/of \$500\.00/)).toBeInTheDocument()
  })

  it('only counts expenses within the selected month', () => {
    mockBudgets = [budget({ amount: 50000 })]
    mockTransactions = [expense({ amount: 2000, date: new Date(2026, 9, 1) }), expense({ amount: 9999, date: new Date(2026, 8, 1) })]
    render(<BudgetHistoryPage />)
    expect(screen.getByText('$20.00 spent')).toBeInTheDocument()
  })

  it('breaks down spend per category that has a budget', () => {
    mockBudgets = [budget({ id: 2, category: 'Food & Dining', amount: 10000 })]
    mockTransactions = [expense({ category: 'Food & Dining', amount: 4000 })]
    render(<BudgetHistoryPage />)
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('$40.00 spent')).toBeInTheDocument()
  })

  it('navigates to the previous month', async () => {
    const user = userEvent.setup({ delay: null })
    render(<BudgetHistoryPage />)
    await user.click(screen.getByRole('button', { name: /previous month/i }))
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })

  it('navigates forward but not past the current month', async () => {
    const user = userEvent.setup({ delay: null })
    render(<BudgetHistoryPage />)
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('November 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next month/i })).toBeDisabled()
  })

  it('explains that past months are shown against today\'s budget amounts', () => {
    render(<BudgetHistoryPage />)
    expect(screen.getByText(/current budget amount/i)).toBeInTheDocument()
  })
})
