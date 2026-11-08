import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrentBalance } from './current-balance'

type MockDB = {
  accounts: { accounts?: Array<{ id: number; balance: number }> }
  transactions: { transactions?: Array<{ type: 'income' | 'expense'; amount: number; date: Date }> }
}

let mockDB: MockDB

vi.mock('@/contexts/db-context', () => ({
  useDB: () => mockDB,
}))

describe('CurrentBalance', () => {
  const now = new Date()

  const loaded = (): MockDB => ({
    accounts: { accounts: [{ id: 1, balance: 3000 }, { id: 2, balance: 2000 }] },
    transactions: {
      transactions: [
        { type: 'income', amount: 1000, date: now },
        { type: 'expense', amount: 250, date: now },
      ],
    },
  })

  it('renders total balance section', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
  })

  it('displays the summed, formatted balance across accounts', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('shows this month\'s net change', () => {
    mockDB = loaded()
    render(<CurrentBalance />)
    expect(screen.getByText('+$750.00')).toBeInTheDocument()
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
