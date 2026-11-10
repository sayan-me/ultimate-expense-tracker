import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoalsPage from './page'
import type { Account, Transaction } from '@/lib/db'

const mockAddAccount = vi.fn()
let mockAccounts: Account[]
let mockTransactions: Transaction[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    accounts: { accounts: mockAccounts, addAccount: mockAddAccount },
    transactions: { transactions: mockTransactions },
  }),
}))

function goalAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: 'New Laptop',
    type: 'savings',
    openingBalance: 0,
    targetAmount: 100000, // $1,000.00
    isDefault: false,
    createdAt: new Date(),
    ...overrides,
  }
}

describe('GoalsPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockAddAccount.mockReset()
    mockAddAccount.mockResolvedValue(2)
    mockAccounts = []
    mockTransactions = []
  })

  it('renders the page title', () => {
    render(<GoalsPage />)
    expect(screen.getByRole('heading', { name: 'Savings Goals', level: 1 })).toBeInTheDocument()
  })

  it('shows an empty state when there are no goals', () => {
    render(<GoalsPage />)
    expect(screen.getByText(/no savings goals yet/i)).toBeInTheDocument()
  })

  it('does not list a plain savings account with no target as a goal', () => {
    mockAccounts = [{ id: 1, name: 'Savings', type: 'savings', openingBalance: 50000, isDefault: false, createdAt: new Date() }]
    render(<GoalsPage />)
    expect(screen.getByText(/no savings goals yet/i)).toBeInTheDocument()
  })

  it('lists a goal with its progress toward the target', () => {
    mockAccounts = [goalAccount({ openingBalance: 25000 })] // 25% of $1,000
    render(<GoalsPage />)
    const card = within(screen.getByTestId('goal-list'))
    expect(card.getByText('New Laptop')).toBeInTheDocument()
    expect(card.getByText(/\$250\.00 saved/)).toBeInTheDocument()
    expect(card.getByText(/of \$1,000\.00/)).toBeInTheDocument()
    expect(card.getByText('25% saved')).toBeInTheDocument()
  })

  it('shows a reached indicator once the goal is met or exceeded', () => {
    mockAccounts = [goalAccount({ openingBalance: 150000 })] // 150% of $1,000
    render(<GoalsPage />)
    expect(screen.getByText(/goal reached/i)).toBeInTheDocument()
  })

  it('creates a new savings goal via the add-goal form', async () => {
    const u = user()
    render(<GoalsPage />)

    await u.type(screen.getByLabelText(/goal name/i), 'Vacation Fund')
    await u.type(screen.getByLabelText(/target amount/i), '2000')
    await u.click(screen.getByRole('button', { name: /add goal/i }))

    await waitFor(() =>
      expect(mockAddAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vacation Fund',
          type: 'savings',
          openingBalance: 0,
          targetAmount: 200000,
          isDefault: false,
        })
      )
    )
  })
})
