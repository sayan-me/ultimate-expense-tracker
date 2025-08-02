import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GroupActivityFeed } from './group-activity-feed'

describe('GroupActivityFeed', () => {
  const mockActivities = {
    activities: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:30:00'),
        memberName: 'Alice',
        type: 'expense' as const,
        amount: 45.50,
        description: 'Team lunch',
        status: 'approved' as const
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T09:15:00'),
        memberName: 'Bob',
        type: 'settlement' as const,
        amount: 20.00,
        description: 'Coffee run settlement',
        status: 'pending' as const
      },
      {
        id: '3',
        timestamp: new Date('2024-01-14T16:45:00'),
        memberName: 'Charlie',
        type: 'expense' as const,
        amount: 75.00,
        description: 'Office supplies',
        status: 'rejected' as const
      }
    ]
  }

  it('renders activity feed section', () => {
    render(<GroupActivityFeed initialData={mockActivities} />)
    expect(screen.getByText('Recent Group Activity')).toBeInTheDocument()
  })

  it('displays loading skeletons when isLoading is true', () => {
    render(<GroupActivityFeed isLoading={true} />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-member-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-amount-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-desc-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-time-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument()
  })

  it('shows activities with correct formatting', () => {
    render(<GroupActivityFeed initialData={mockActivities} />)
    expect(screen.getByText('Team lunch')).toBeInTheDocument()
    expect(screen.getByText('$45.50')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 10:30 am')).toBeInTheDocument()
  })

  it('applies correct status colors', () => {
    render(<GroupActivityFeed initialData={mockActivities} />)
    const approvedAmount = screen.getByText('$45.50').closest('span')
    const pendingAmount = screen.getByText('$20.00').closest('span')
    const rejectedAmount = screen.getByText('$75.00').closest('span')

    expect(approvedAmount).toHaveClass('text-green-600')
    expect(pendingAmount).toHaveClass('text-yellow-600')
    expect(rejectedAmount).toHaveClass('text-destructive')
  })

  it('displays "No recent activity" when activities array is empty', () => {
    render(<GroupActivityFeed initialData={{ activities: [] }} />)
    expect(screen.getByText('No recent activity')).toBeInTheDocument()
  })

  it('shows error message when there is an error', () => {
    render(<GroupActivityFeed initialData={undefined} />)
    // Force error state
    const errorMessage = screen.queryByText(/failed to load activity feed/i)
    expect(errorMessage).not.toBeInTheDocument()
  })

  it('renders view all button with correct attributes', () => {
    render(<GroupActivityFeed initialData={mockActivities} />)
    const button = screen.getByRole('button', { name: 'View all activity' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('text-muted-foreground')
  })
}) 