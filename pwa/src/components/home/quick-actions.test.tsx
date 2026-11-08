import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Plus } from 'lucide-react'
import { QuickActions } from './quick-actions'
import { useActivities } from '@/contexts/activities-context'

// Mock the activities context
vi.mock('@/contexts/activities-context', () => ({
  useActivities: vi.fn()
}))

describe('QuickActions', () => {
  beforeEach(() => {
    // Setup default mock values
    vi.mocked(useActivities).mockReturnValue({
      selectedQuickActions: [
        { icon: Plus, label: "Log Transactions", onClick: vi.fn() },
        { icon: Plus, label: "Set Budget", onClick: vi.fn() },
        { icon: Plus, label: "View Stats", onClick: vi.fn() }
      ],
      toggleCustomizationMode: vi.fn(),
      toggleActivitiesBar: vi.fn(),
      isCustomizing: false,
      toggleQuickAction: vi.fn(),
      isGroupMode: false
    })
  })

  it('renders section title', () => {
    render(<QuickActions />)
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('renders selected quick actions', () => {
    render(<QuickActions />)
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByText('Set Budget')).toBeInTheDocument()
    expect(screen.getByText('View Stats')).toBeInTheDocument()
  })

  it('displays customize button with settings icon', () => {
    render(<QuickActions />)
    const customizeButton = screen.getByRole('button', { name: /customize quick actions/i })
    expect(customizeButton).toBeInTheDocument()
    expect(customizeButton.querySelector('svg')).toBeInTheDocument() // Settings icon
  })

  it('shows empty slots when less than 9 actions selected', () => {
    const { container } = render(<QuickActions />)
    const emptySlots = container.querySelectorAll('div[aria-hidden="true"]')
    expect(emptySlots.length).toBe(6) // 9 total - 3 selected = 6 empty
  })

  it('opens activities bar in customize mode when customize button is clicked', () => {
    const toggleCustomizationMode = vi.fn()
    const toggleActivitiesBar = vi.fn()
    vi.mocked(useActivities).mockReturnValue({
      selectedQuickActions: [],
      toggleCustomizationMode,
      toggleActivitiesBar,
      isCustomizing: false,
      toggleQuickAction: vi.fn(),
      isGroupMode: false
    })

    render(<QuickActions />)
    const customizeButton = screen.getByRole('button', { name: /customize quick actions/i })
    fireEvent.click(customizeButton)
    
    expect(toggleCustomizationMode).toHaveBeenCalledWith(true)
    expect(toggleActivitiesBar).toHaveBeenCalledWith(true)
  })

  it('triggers action when quick action button is clicked', () => {
    const mockOnClick = vi.fn()
    vi.mocked(useActivities).mockReturnValue({
      selectedQuickActions: [
        { icon: vi.fn(), label: "Test Action", onClick: mockOnClick }
      ],
      toggleCustomizationMode: vi.fn(),
      toggleActivitiesBar: vi.fn(),
      isCustomizing: false,
      toggleQuickAction: vi.fn(),
      isGroupMode: false
    })

    render(<QuickActions />)
    const actionButton = screen.getByRole('button', { name: /test action/i })
    fireEvent.click(actionButton)
    
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('applies correct styles to quick action buttons', () => {
    render(<QuickActions />)
    const actionButton = screen.getByRole('button', { name: /log transactions/i })
    
    expect(actionButton).toHaveClass('bg-primary/10')
    expect(actionButton.querySelector('svg')).toHaveClass('text-primary')
  })

  it('maintains accessibility features', () => {
    render(<QuickActions />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
    })
  })
}) 