import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupStats } from './group-stats'
import { getGroupStats } from '@/lib/data'

// Component still runs on mock data (lib/data); stub it for deterministic tests
vi.mock('@/lib/data', () => ({
  getGroupStats: vi.fn(),
}))

describe('GroupStats', () => {
  beforeEach(() => {
    vi.mocked(getGroupStats).mockResolvedValue({
      totalSpending: 1500,
      monthlyBudget: 3000,
      categories: [{ name: 'Food', amount: 500 }],
    })
  })

  it('does not render stats while loading', () => {
    render(<GroupStats />)
    expect(screen.queryByText('Group Stats')).not.toBeInTheDocument()
  })

  it('renders group stats once loaded', async () => {
    render(<GroupStats />)
    expect(await screen.findByText('Group Stats')).toBeInTheDocument()
    expect(screen.getByText('$1500')).toBeInTheDocument()
    expect(screen.getByText('of $3000 budget')).toBeInTheDocument()
  })

  it('renders progress bar with correct values', async () => {
    render(<GroupStats />)
    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '1500')
    expect(bar).toHaveAttribute('aria-valuemax', '3000')
    expect(bar).toHaveStyle({ width: '50%' })
  })

  it('renders category view button', async () => {
    render(<GroupStats />)
    expect(await screen.findByRole('button', { name: /view category-wise spending/i })).toBeInTheDocument()
  })

  it('shows an error alert when loading fails', async () => {
    vi.mocked(getGroupStats).mockRejectedValue(new Error('boom'))
    render(<GroupStats />)
    expect(await screen.findByText(/Failed to load group stats: boom/)).toBeInTheDocument()
  })

  it('shows an error when the unimplemented category view is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<GroupStats />)
    await user.click(await screen.findByRole('button', { name: /view category-wise spending/i }))
    expect(screen.getByText(/Category view not implemented yet/)).toBeInTheDocument()
  })
})
