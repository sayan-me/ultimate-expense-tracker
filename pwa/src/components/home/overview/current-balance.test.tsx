import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrentBalance } from './current-balance'

type MockDB = {
  accounts: { accounts?: Array<{ id: number; openingBalance: number }> }
  transactions: { transactions?: Array<{ type: 'income' | 'expense'; amount: number; date: Date; accountId: number }> }
}

let mockDB: MockDB

vi.mock('@/contexts/db-context', () => ({
  useDB: () => mockDB,
}))

describe('CurrentBalance', () => {
  const now = new Date()

  // Amounts/openingBalance are in cents. Account 1: 3000 (opening) + 1000
  // (income) - 250 (expense) = 3750. Account 2: 2000 (opening), untouched.
  // Total = 5750 cents = $57.50; net change this month = 1000 - 250 = 750 = $7.50.
  const loaded = (): MockDB => ({
    accounts: {
      accounts: [
        { id: 1, openingBalance: 3000 },
        { id: 2, openingBalance: 2000 },
      ],
    },
    transactions: {
      transactions: [
        { type: 'income', amount: 1000, date: now, accountId: 1 },
        { type: 'expense', amount: 250, date: now, accountId: 1 },
      ],
    },
  })

  it('renders total balance section', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
  })

  it('displays the derived, formatted balance across accounts', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('$57.50')).toBeInTheDocument()
  })

  it('shows this month\'s net change', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('+$7.50')).toBeInTheDocument()
  })

  it('shows account and transaction counts', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('Across 2 accounts')).toBeInTheDocument()
    expect(screen.getByText('2 transactions')).toBeInTheDocument()
  })

  it('displays loading skeletons while data is undefined', () => {
    mockDB = { accounts: {}, transactions: {} }
    render(<CurrentBalance />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-balance')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-subtitle')).toBeInTheDocument()
  })

  it('does not show balance data while loading', () => {
    mockDB = { accounts: {}, transactions: {} }
    render(<CurrentBalance />)
    expect(screen.queryByText('Total Balance')).not.toBeInTheDocument()
  })
})
