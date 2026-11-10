import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Overview } from './overview'
import { renderWithProviders } from '@/tests/test-utils'

let mockGroupMode = false

vi.mock('@/contexts/activities-context', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/activities-context')>('@/contexts/activities-context')
  return { ...actual, useActivities: () => ({ isGroupMode: mockGroupMode }) }
})

// Child widgets have their own tests; stub them here
vi.mock('./current-balance', () => ({ CurrentBalance: () => <div>Total Balance</div> }))
vi.mock('./monthly-spend', () => ({ MonthlySpend: () => <div>Monthly Spend vs Budget</div> }))
vi.mock('./recent-expenses', () => ({ RecentExpenses: () => <div>Recent Transactions</div> }))
vi.mock('./groups-overview', () => ({ GroupsOverview: () => <div>Groups Overview Widget</div> }))

describe('Overview', () => {
  beforeEach(() => {
    mockGroupMode = false
  })

  it('renders financial overview section', () => {
    renderWithProviders(<Overview />)
    expect(screen.getByLabelText('Financial overview')).toBeInTheDocument()
  })

  it('shows personal mode components by default', async () => {
    renderWithProviders(<Overview />)
    expect(await screen.findByText('Total Balance')).toBeInTheDocument()
    expect(await screen.findByText('Monthly Spend vs Budget')).toBeInTheDocument()
    expect(await screen.findByText('Recent Transactions')).toBeInTheDocument()
  })

  it('does not render group mode components in personal mode', async () => {
    renderWithProviders(<Overview />)
    await screen.findByText('Total Balance')
    expect(screen.queryByText('Groups Overview Widget')).not.toBeInTheDocument()
  })

  it('shows a sign-in fallback instead of the groups widget when signed out', () => {
    mockGroupMode = true
    renderWithProviders(<Overview />)
    expect(screen.getByText('Your Groups')).toBeInTheDocument()
    expect(screen.queryByText('Groups Overview Widget')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Balance')).not.toBeInTheDocument()
  })
})
