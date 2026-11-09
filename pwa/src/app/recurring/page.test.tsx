import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecurringPage from './page'
import type { Account, RecurringTransaction } from '@/lib/db'

const mockAddRecurring = vi.fn()
const mockUpdateRecurring = vi.fn()
const mockDeleteRecurring = vi.fn()
let mockRecurring: RecurringTransaction[]
let mockAccounts: Account[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    recurring: {
      recurringTransactions: mockRecurring,
      addRecurring: mockAddRecurring,
      updateRecurring: mockUpdateRecurring,
      deleteRecurring: mockDeleteRecurring,
    },
    accounts: { accounts: mockAccounts },
    transactions: { transactions: [] },
  }),
}))

function account(overrides: Partial<Account> = {}): Account {
  return { id: 1, name: 'Cash', type: 'cash', openingBalance: 0, isDefault: true, createdAt: new Date(), ...overrides }
}

function recurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 1,
    accountId: 1,
    type: 'expense',
    category: 'Subscriptions',
    description: 'Streaming',
    amount: 1500,
    frequency: 'monthly',
    startDate: new Date('2026-11-01T00:00:00'),
    nextRunDate: new Date('2026-12-01T00:00:00'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('RecurringPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockAddRecurring.mockReset()
    mockAddRecurring.mockResolvedValue(2)
    mockUpdateRecurring.mockReset()
    mockUpdateRecurring.mockResolvedValue(undefined)
    mockDeleteRecurring.mockReset()
    mockDeleteRecurring.mockResolvedValue(undefined)
    mockRecurring = []
    mockAccounts = [account()]
  })

  it('renders the page title', () => {
    render(<RecurringPage />)
    expect(screen.getByRole('heading', { name: 'Recurring Transactions', level: 1 })).toBeInTheDocument()
  })

  it('shows an empty state when there are none yet', () => {
    render(<RecurringPage />)
    expect(screen.getByText(/no recurring transactions yet/i)).toBeInTheDocument()
  })

  it('lists existing recurring transactions with amount, frequency, and next run date', () => {
    mockRecurring = [recurring()]
    render(<RecurringPage />)
    const list = within(screen.getByTestId('recurring-list'))
    expect(list.getByText('Streaming')).toBeInTheDocument()
    expect(list.getByText('$15.00')).toBeInTheDocument()
    expect(list.getByText(/monthly/i)).toBeInTheDocument()
    expect(list.getByText(/dec 1, 2026/i)).toBeInTheDocument()
  })

  it('creates a new recurring transaction via the add form', async () => {
    const u = user()
    render(<RecurringPage />)

    await u.type(screen.getByLabelText(/description/i), 'Gym membership')
    await u.type(screen.getByLabelText(/amount/i), '30')
    await u.click(screen.getByRole('button', { name: /add recurring transaction/i }))

    await waitFor(() =>
      expect(mockAddRecurring).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Gym membership',
          amount: 3000,
          type: 'expense',
          frequency: 'monthly',
          accountId: 1,
          isActive: true,
        })
      )
    )
  })

  it('toggles isActive via a pause/resume control', async () => {
    const u = user()
    mockRecurring = [recurring({ isActive: true })]
    render(<RecurringPage />)

    await u.click(screen.getByRole('button', { name: /pause/i }))

    await waitFor(() => expect(mockUpdateRecurring).toHaveBeenCalledWith(1, { isActive: false }))
  })

  it('shows a resume control for a paused recurring transaction', () => {
    mockRecurring = [recurring({ isActive: false })]
    render(<RecurringPage />)
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
  })

  it('deletes a recurring transaction', async () => {
    const u = user()
    mockRecurring = [recurring()]
    render(<RecurringPage />)

    await u.click(screen.getByRole('button', { name: /delete streaming/i }))

    await waitFor(() => expect(mockDeleteRecurring).toHaveBeenCalledWith(1))
  })
})
