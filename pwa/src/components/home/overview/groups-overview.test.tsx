import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { GroupsOverview } from './groups-overview'
import type { GroupSummary } from '@/lib/groups-api'

let mockGroups: GroupSummary[] | undefined
let mockLoading: boolean
let mockError: string | null

vi.mock('@/hooks/use-groups', () => ({
  useGroups: () => ({
    groups: mockGroups,
    loading: mockLoading,
    error: mockError,
  }),
}))

describe('GroupsOverview', () => {
  beforeEach(() => {
    mockGroups = []
    mockLoading = false
    mockError = null
  })

  it('shows a loading state without crashing', () => {
    mockLoading = true
    mockGroups = undefined
    const { container } = render(<GroupsOverview />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows an error message instead of crashing', () => {
    mockError = 'Network error'
    render(<GroupsOverview />)
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('shows an empty state with a way to create a group when the user has none', () => {
    mockGroups = []
    render(<GroupsOverview />)
    expect(screen.getByText(/not in any groups yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create a group/i })).toHaveAttribute('href', '/groups')
  })

  // Reported in live UAT (S3): this card used to show hardcoded
  // placeholder people ("Alice owes $50, Bob gets $30, Charlie owes
  // $25") even for a user whose real group had a real roommate in it —
  // the fix is to show the user's actual groups, nothing fabricated.
  it('lists the user\'s real groups, never fabricated placeholder data', () => {
    mockGroups = [
      { id: 'g1', name: 'ZZZ-TEST-Roommates', createdBy: 1, createdAt: '2026-01-01T00:00:00.000Z', memberCount: 2 },
    ]
    render(<GroupsOverview />)
    expect(screen.getByText('ZZZ-TEST-Roommates')).toBeInTheDocument()
    expect(screen.getByText(/2 members/i)).toBeInTheDocument()
    expect(screen.queryByText(/alice|bob|charlie/i)).not.toBeInTheDocument()
  })

  it('links each group to its detail page and offers a link to view all', () => {
    mockGroups = [{ id: 'g1', name: 'Roommates', createdBy: 1, createdAt: '2026-01-01T00:00:00.000Z', memberCount: 2 }]
    render(<GroupsOverview />)
    expect(screen.getByRole('link', { name: /roommates/i })).toHaveAttribute('href', '/groups/g1')
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/groups')
  })

  it('shows a singular "member" label for a group of one', () => {
    mockGroups = [{ id: 'g1', name: 'Solo', createdBy: 1, createdAt: '2026-01-01T00:00:00.000Z', memberCount: 1 }]
    render(<GroupsOverview />)
    const card = within(screen.getByText('Solo').closest('a')!)
    expect(card.getByText(/1 member$/i)).toBeInTheDocument()
  })
})
