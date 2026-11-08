import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySpend } from './monthly-spend'
import { getMonthlySpendData } from '@/lib/data'

// Component still runs on mock data (lib/data); stub it for deterministic tests
vi.mock('@/lib/data', () => ({
  getMonthlySpendData: vi.fn(),
}))

describe('MonthlySpend', () => {
  beforeEach(() => {
    vi.mocked(getMonthlySpendData).mockResolvedValue({ monthlySpend: 1200, monthlyBudget: 2000 })
  })

  it('shows loading skeletons before data resolves', () => {
    render(<MonthlySpend />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.queryByText('Monthly Spend vs Budget')).not.toBeInTheDocument()
  })

  it('renders monthly spend section once loaded', async () => {
    render(<MonthlySpend />)
    expect(await screen.findByText('Monthly Spend vs Budget')).toBeInTheDocument()
  })

  it('displays spent and budget amounts', async () => {
    render(<MonthlySpend />)
    expect(await screen.findByText('$1,200.00')).toBeInTheDocument()
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
  })

  it('shows percentage used', async () => {
    render(<MonthlySpend />)
    expect(await screen.findByText('60% used')).toBeInTheDocument()
  })

  it('shows an error alert when loading fails', async () => {
    vi.mocked(getMonthlySpendData).mockRejectedValue(new Error('boom'))
    render(<MonthlySpend />)
    expect(await screen.findByText(/Failed to load monthly spend data: boom/)).toBeInTheDocument()
  })
})
