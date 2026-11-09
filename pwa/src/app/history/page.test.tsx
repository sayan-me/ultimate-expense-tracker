import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistoryPage from './page'
import type { Transaction } from '@/lib/db'

let mockTransactions: Transaction[] | undefined

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { transactions: mockTransactions },
  }),
}))

vi.mock('@/components/expense/add-expense-modal', () => ({
  AddExpenseModal: () => null,
}))

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    amount: 1000,
    type: 'expense',
    category: 'Food',
    description: 'Lunch',
    date: new Date('2026-11-05T12:00:00'),
    accountId: 1,
    createdAt: new Date('2026-11-05T12:00:00'),
    updatedAt: new Date('2026-11-05T12:00:00'),
    ...overrides,
  }
}

describe('HistoryPage', () => {
  it('renders the page title', () => {
    mockTransactions = [tx()]
    render(<HistoryPage />)
    expect(screen.getByRole('heading', { name: 'Transaction History' })).toBeInTheDocument()
  })

  it('groups transactions by date and expands a group to show its rows', async () => {
    const user = userEvent.setup()
    mockTransactions = [tx({ id: 1, description: 'Lunch' })]
    render(<HistoryPage />)

    await user.click(screen.getByText('November 5, 2026'))
    expect(screen.getByText('Lunch')).toBeInTheDocument()
  })

  it('shows an expense in red with a minus sign', async () => {
    const user = userEvent.setup()
    mockTransactions = [tx({ type: 'expense', amount: 1000 })]
    render(<HistoryPage />)
    await user.click(screen.getByText('November 5, 2026'))
    expect(screen.getByText('-$10.00')).toBeInTheDocument()
  })

  it('shows income in green with a plus sign', async () => {
    const user = userEvent.setup()
    mockTransactions = [tx({ type: 'income', amount: 1000 })]
    render(<HistoryPage />)
    await user.click(screen.getByText('November 5, 2026'))
    expect(screen.getByText('+$10.00')).toBeInTheDocument()
  })

  it('shows a transfer_out with a minus sign and transfer_in with a plus sign', async () => {
    const user = userEvent.setup()
    mockTransactions = [
      tx({ id: 1, type: 'transfer_out', amount: 2000, category: 'Transfer', description: 'To savings', transferId: 't1' }),
      tx({ id: 2, type: 'transfer_in', amount: 2000, category: 'Transfer', description: 'To savings', transferId: 't1' }),
    ]
    render(<HistoryPage />)
    await user.click(screen.getByText('November 5, 2026'))
    expect(screen.getByText('-$20.00')).toBeInTheDocument()
    expect(screen.getByText('+$20.00')).toBeInTheDocument()
  })

  it('does not make a transfer row clickable/editable', async () => {
    const user = userEvent.setup()
    mockTransactions = [tx({ type: 'transfer_out', category: 'Transfer', description: 'To savings' })]
    render(<HistoryPage />)
    await user.click(screen.getByText('November 5, 2026'))
    // An editable row is a <button>; a transfer row must not be one.
    expect(screen.queryByRole('button', { name: /to savings/i })).not.toBeInTheDocument()
    expect(screen.getByText('To savings')).toBeInTheDocument()
  })

  it('filters by search query across description and category', async () => {
    const user = userEvent.setup()
    mockTransactions = [tx({ id: 1, description: 'Lunch', category: 'Food' }), tx({ id: 2, description: 'Taxi', category: 'Transport' })]
    render(<HistoryPage />)
    await user.type(screen.getByPlaceholderText('Search transactions...'), 'taxi')
    await user.click(screen.getByText('November 5, 2026'))
    expect(screen.getByText('Taxi')).toBeInTheDocument()
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no transactions', () => {
    mockTransactions = []
    render(<HistoryPage />)
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
  })
})
