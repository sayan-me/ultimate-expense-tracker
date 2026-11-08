import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OutstandingBalances } from './outstanding-balances'
import { getOutstandingBalances } from '@/lib/data'

// Component still runs on mock data (lib/data); stub it for deterministic tests
vi.mock('@/lib/data', () => ({
  getOutstandingBalances: vi.fn(),
}))

describe('OutstandingBalances', () => {
  const balances = {
    balances: [
      { memberId: '1', memberName: 'Alice', amount: 50, owesTo: 'Group Pool' },
      { memberId: '2', memberName: 'Bob', amount: -30, owesTo: 'Group Pool' },
      { memberId: '3', memberName: 'Charlie', amount: 0, owesTo: 'Alice' },
    ],
  }

  beforeEach(() => {
    vi.mocked(getOutstandingBalances).mockResolvedValue(balances)
  })

  it('does not render the section while loading', () => {
    render(<OutstandingBalances />)
    expect(screen.queryByText('Outstanding Balances')).not.toBeInTheDocument()
  })

  it('renders outstanding balances section once loaded', async () => {
    render(<OutstandingBalances />)
    expect(await screen.findByText('Outstanding Balances')).toBeInTheDocument()
  })

  it('shows member balances with settlement text', async () => {
    render(<OutstandingBalances />)
    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('Owes to Group Pool')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('Gets from Group Pool')).toBeInTheDocument()
    expect(screen.getByText('Settled')).toBeInTheDocument()
  })

  it('colors amounts owed red and amounts receivable green', async () => {
    render(<OutstandingBalances />)
    expect(await screen.findByText('$50.00')).toHaveClass('text-red-500')
    expect(screen.getByText('$30.00')).toHaveClass('text-green-500')
  })

  it('renders a view all button', async () => {
    render(<OutstandingBalances />)
    const button = await screen.findByRole('button', { name: 'View all balances' })
    expect(button).toHaveClass('text-muted-foreground')
  })

  it('shows an error alert when loading fails', async () => {
    vi.mocked(getOutstandingBalances).mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<OutstandingBalances />)
    expect(await screen.findByText(/Failed to load balances: boom/)).toBeInTheDocument()
  })

  it('shows an error alert when the unimplemented detail view is requested', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<OutstandingBalances />)
    await user.click(await screen.findByRole('button', { name: 'View all balances' }))
    expect(screen.getByText(/Detailed view not implemented yet/)).toBeInTheDocument()
  })
})
