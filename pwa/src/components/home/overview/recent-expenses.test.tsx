import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecentExpenses } from './recent-expenses'

let mockRecent: unknown[] | undefined

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { useRecentTransactions: () => mockRecent },
    categories: { categories: [{ id: 1, name: 'Food & Dining', color: '#3b82f6' }] },
  }),
}))

// The empty state embeds the add-expense modal, which needs the full DB context
vi.mock('@/components/expense/add-expense-modal', () => ({
  AddExpenseModal: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}))

describe('RecentExpenses', () => {
  const transactions = [
    {
      id: 1,
      type: 'expense',
      amount: 42.5,
      category: 'Food & Dining',
      description: 'Lunch at Subway',
      date: new Date('2025-01-15T12:30:00'),
      tags: ['Essential'],
    },
    {
      id: 2,
      type: 'income',
      amount: 100,
      category: 'Salary',
      description: 'Bonus',
      date: new Date('2025-01-16T09:00:00'),
      tags: [],
    },
  ]

  it('renders recent transactions section and view all button', () => {
    mockRecent = transactions
    render(<RecentExpenses />)
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view all transactions/i })).toBeInTheDocument()
  })

  it('shows transactions with correct details and signs', () => {
    mockRecent = transactions
    render(<RecentExpenses />)
    expect(screen.getByText('Lunch at Subway')).toBeInTheDocument()
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('-$42.50')).toBeInTheDocument()
    expect(screen.getByText('+$100.00')).toBeInTheDocument()
    expect(screen.getByText('Essential')).toBeInTheDocument()
  })

  it('colors the category dot from the category\'s own stored color, not the transaction type', () => {
    // U5 (bug report): the dot used to be hardcoded red for every
    // expense regardless of category.
    mockRecent = transactions
    const { container } = render(<RecentExpenses />)
    const dot = container.querySelector('div.rounded-full.w-2.h-2') as HTMLElement
    expect(dot.style.backgroundColor).toBe('rgb(59, 130, 246)') // #3b82f6
  })

  it('shows an empty state when there are no transactions', () => {
    mockRecent = []
    render(<RecentExpenses />)
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('displays loading skeletons while data is undefined', () => {
    mockRecent = undefined
    render(<RecentExpenses />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument()
  })
})
