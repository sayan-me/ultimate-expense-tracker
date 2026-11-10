import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroupsPage from './page'
import type { GroupSummary } from '@/lib/groups-api'

const mockCreateGroup = vi.fn()
const mockRefetch = vi.fn()
let mockGroups: GroupSummary[] | undefined
let mockLoading: boolean
let mockError: string | null

vi.mock('@/hooks/use-groups', () => ({
  useGroups: () => ({
    groups: mockGroups,
    loading: mockLoading,
    error: mockError,
    createGroup: mockCreateGroup,
    refetch: mockRefetch,
  }),
}))

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    id: 'g1',
    name: 'Roommates',
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    memberCount: 3,
    ...overrides,
  }
}

describe('GroupsPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockCreateGroup.mockReset()
    mockCreateGroup.mockResolvedValue(group())
    mockRefetch.mockReset()
    mockGroups = [group()]
    mockLoading = false
    mockError = null
  })

  it('renders the page title', () => {
    render(<GroupsPage />)
    expect(screen.getByRole('heading', { name: 'Groups', level: 1 })).toBeInTheDocument()
  })

  it('lists every group with its name and member count', () => {
    mockGroups = [
      group({ id: 'g1', name: 'Roommates', memberCount: 3 }),
      group({ id: 'g2', name: 'Trip to Japan', memberCount: 5 }),
    ]
    render(<GroupsPage />)
    expect(screen.getByText('Roommates')).toBeInTheDocument()
    expect(screen.getByText('Trip to Japan')).toBeInTheDocument()
    expect(screen.getByText(/3 members/i)).toBeInTheDocument()
    expect(screen.getByText(/5 members/i)).toBeInTheDocument()
  })

  it('links each group to its detail page', () => {
    mockGroups = [group({ id: 'g1', name: 'Roommates' })]
    render(<GroupsPage />)
    const link = screen.getByRole('link', { name: /roommates/i })
    expect(link).toHaveAttribute('href', '/groups/g1')
  })

  it('shows a loading state', () => {
    mockGroups = undefined
    mockLoading = true
    render(<GroupsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows an error state', () => {
    mockGroups = undefined
    mockError = 'Failed to load groups'
    render(<GroupsPage />)
    expect(screen.getByText(/failed to load groups/i)).toBeInTheDocument()
  })

  it('creates a new group via the add-group form', async () => {
    const u = user()
    render(<GroupsPage />)

    await u.type(screen.getByLabelText(/group name/i), 'Book Club')
    await u.click(screen.getByRole('button', { name: /add group/i }))

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledWith('Book Club'))
  })

  it('shows an inline error when creating a group fails', async () => {
    const u = user()
    mockCreateGroup.mockRejectedValue(new Error('Group name already in use'))
    render(<GroupsPage />)

    await u.type(screen.getByLabelText(/group name/i), 'Book Club')
    await u.click(screen.getByRole('button', { name: /add group/i }))

    await waitFor(() => expect(screen.getByText(/group name already in use/i)).toBeInTheDocument())
  })
})
