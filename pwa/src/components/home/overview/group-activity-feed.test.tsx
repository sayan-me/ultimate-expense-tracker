import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupActivityFeed } from './group-activity-feed'
import { getGroupActivities } from '@/lib/data'

// Component still runs on mock data (lib/data); stub it for deterministic tests
vi.mock('@/lib/data', () => ({
  getGroupActivities: vi.fn(),
}))

describe('GroupActivityFeed', () => {
  const activities = {
    activities: [
      {
        id: '1',
        timestamp: new Date('2025-01-15T12:30:00'),
        memberName: 'Alice',
        type: 'expense' as const,
        amount: 45.5,
        description: 'Team lunch',
        status: 'approved' as const,
      },
      {
        id: '2',
        timestamp: new Date('2025-01-16T09:00:00'),
        memberName: 'Bob',
        type: 'settlement' as const,
        amount: 20,
        description: 'Settle up',
        status: 'pending' as const,
      },
      {
        id: '3',
        timestamp: new Date('2025-01-17T09:00:00'),
        memberName: 'Charlie',
        type: 'adjustment' as const,
        amount: 5,
        description: 'Fix',
        status: 'rejected' as const,
      },
    ],
  }

  beforeEach(() => {
    vi.mocked(getGroupActivities).mockResolvedValue(activities)
  })

  it('renders activity feed section once loaded', async () => {
    render(<GroupActivityFeed />)
    expect(await screen.findByText('Recent Activity')).toBeInTheDocument()
  })

  it('shows activities with correct formatting', async () => {
    render(<GroupActivityFeed />)
    expect(await screen.findByText('Team lunch')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('$45.50')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 12:30 PM')).toBeInTheDocument()
  })

  it('applies status colors to amounts', async () => {
    render(<GroupActivityFeed />)
    expect(await screen.findByText('$45.50')).toHaveClass('text-green-500')
    expect(screen.getByText('$20.00')).toHaveClass('text-yellow-500')
    expect(screen.getByText('$5.00')).toHaveClass('text-red-500')
  })

  it('displays "No recent activity" when there are no activities', async () => {
    vi.mocked(getGroupActivities).mockResolvedValue({ activities: [] })
    render(<GroupActivityFeed />)
    expect(await screen.findByText('No recent activity')).toBeInTheDocument()
  })

  it('renders a view all button', async () => {
    render(<GroupActivityFeed />)
    const button = await screen.findByRole('button', { name: 'View all activities' })
    expect(button).toHaveClass('text-muted-foreground')
  })

  it('shows an error alert when loading fails', async () => {
    vi.mocked(getGroupActivities).mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<GroupActivityFeed />)
    expect(await screen.findByText(/Failed to load activity feed: boom/)).toBeInTheDocument()
  })
})
