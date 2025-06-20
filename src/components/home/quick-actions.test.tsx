import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { QuickActions } from './quick-actions'
import { renderWithProviders } from '@/tests/test-utils'
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
        { icon: vi.fn(), label: "Log Transactions", onClick: vi.fn() },
        { icon: vi.fn(), label: "Set Budget", onClick: vi.fn() },
        { icon: vi.fn(), label: "View Stats", onClick: vi.fn() }
      ],
      toggleCustomizationMode: vi.fn(),
      toggleActivitiesBar: vi.fn(),
      isCustomizing: false,
      toggleQuickAction: vi.fn(),
      isGroupMode: false
    })
  })

  it('renders section title', () => {
    renderWithProviders(<QuickActions />)
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('renders selected quick actions', () => {
    renderWithProviders(<QuickActions />)
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByText('Set Budget')).toBeInTheDocument()
    expect(screen.getByText('View Stats')).toBeInTheDocument()
  })

  it('displays customize button with settings icon', () => {
    renderWithProviders(<QuickActions />)
    const customizeButton = screen.getByRole('button', { name: /customize quick actions/i })
    expect(customizeButton).toBeInTheDocument()
    expect(customizeButton.querySelector('svg')).toBeInTheDocument() // Settings icon
  })

  it('shows empty slots when less than 9 actions selected', () => {
    renderWithProviders(<QuickActions />)
    const emptySlots = screen.getAllByRole('presentation')
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

    renderWithProviders(<QuickActions />)
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

    renderWithProviders(<QuickActions />)
    const actionButton = screen.getByRole('button', { name: /test action/i })
    fireEvent.click(actionButton)
    
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('applies correct styles to quick action buttons', () => {
    renderWithProviders(<QuickActions />)
    const actionButton = screen.getByRole('button', { name: /log transactions/i })
    
    expect(actionButton).toHaveClass('bg-primary/10')
    expect(actionButton.querySelector('svg')).toHaveClass('text-primary')
  })

  it('maintains accessibility features', () => {
    renderWithProviders(<QuickActions />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
    })
  })
}) 