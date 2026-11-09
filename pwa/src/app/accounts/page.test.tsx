import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountsPage from './page'
import type { Account, Transaction } from '@/lib/db'

const mockAddAccount = vi.fn()
const mockDeleteAccount = vi.fn()
const mockCreateTransfer = vi.fn()
let mockAccounts: Account[]
let mockTransactions: Transaction[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    accounts: {
      accounts: mockAccounts,
      addAccount: mockAddAccount,
      deleteAccount: mockDeleteAccount,
    },
    transactions: {
      transactions: mockTransactions,
      createTransfer: mockCreateTransfer,
    },
  }),
}))

function account(overrides: Partial<Account> = {}): Account {
  return { id: 1, name: 'Cash', type: 'cash', openingBalance: 10000, isDefault: true, createdAt: new Date(), ...overrides }
}

describe('AccountsPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockAddAccount.mockReset()
    mockAddAccount.mockResolvedValue(2)
    mockDeleteAccount.mockReset()
    mockDeleteAccount.mockResolvedValue(undefined)
    mockCreateTransfer.mockReset()
    mockCreateTransfer.mockResolvedValue(undefined)
    mockAccounts = [account()]
    mockTransactions = []
  })

  it('renders the page title', () => {
    render(<AccountsPage />)
    expect(screen.getByRole('heading', { name: 'Accounts', level: 1 })).toBeInTheDocument()
  })

  it('lists every account with its derived balance', () => {
    mockAccounts = [account({ id: 1, name: 'Cash', openingBalance: 10000 }), account({ id: 2, name: 'Bank', openingBalance: 50000, isDefault: false })]
    render(<AccountsPage />)
    const list = within(screen.getByTestId('account-list'))
    expect(list.getByText('Cash')).toBeInTheDocument()
    expect(list.getByText('Bank')).toBeInTheDocument()
    expect(list.getByText('$100.00')).toBeInTheDocument()
    expect(list.getByText('$500.00')).toBeInTheDocument()
  })

  it('creates a new account via the add-account form', async () => {
    const u = user()
    render(<AccountsPage />)

    await u.type(screen.getByLabelText(/account name/i), 'Savings Jar')
    await u.type(screen.getByLabelText(/opening balance/i), '25')
    await u.click(screen.getByRole('button', { name: /add account/i }))

    await waitFor(() =>
      expect(mockAddAccount).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Savings Jar', type: 'cash', openingBalance: 2500, isDefault: false })
      )
    )
  })

  it('deletes a non-default account', async () => {
    const u = user()
    mockAccounts = [account({ id: 1 }), account({ id: 2, name: 'Bank', isDefault: false })]
    render(<AccountsPage />)

    await u.click(screen.getByRole('button', { name: /delete bank/i }))

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledWith(2))
  })

  it('does not show a delete button for the default account', () => {
    render(<AccountsPage />)
    expect(screen.queryByRole('button', { name: /delete cash/i })).not.toBeInTheDocument()
  })

  it('shows an error message when deleting an account fails (e.g. it still has transactions)', async () => {
    const u = user()
    mockDeleteAccount.mockRejectedValue(new Error('Cannot delete account - it has 2 transaction(s)'))
    mockAccounts = [account({ id: 1 }), account({ id: 2, name: 'Bank', isDefault: false })]
    render(<AccountsPage />)

    await u.click(screen.getByRole('button', { name: /delete bank/i }))

    await waitFor(() => expect(screen.getByText(/cannot delete account - it has 2 transaction\(s\)/i)).toBeInTheDocument())
  })

  it('does not show the transfer form with fewer than two accounts', () => {
    render(<AccountsPage />)
    expect(screen.queryByRole('heading', { name: /transfer/i })).not.toBeInTheDocument()
  })

  it('transfers money between two accounts', async () => {
    const u = user()
    mockAccounts = [account({ id: 1, name: 'Cash' }), account({ id: 2, name: 'Bank', isDefault: false })]
    render(<AccountsPage />)

    await u.click(screen.getByText('From account'))
    await u.click(screen.getByRole('option', { name: /Cash/ }))
    await u.click(screen.getByText('To account'))
    await u.click(screen.getByRole('option', { name: /Bank/ }))
    await u.type(screen.getByLabelText(/transfer amount/i), '40')
    await u.click(screen.getByRole('button', { name: /^transfer$/i }))

    await waitFor(() =>
      expect(mockCreateTransfer).toHaveBeenCalledWith(
        expect.objectContaining({ fromAccountId: 1, toAccountId: 2, amount: 4000 })
      )
    )
  })
})
