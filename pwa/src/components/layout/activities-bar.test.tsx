import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ActivitiesBar } from './activities-bar'
import { renderWithProviders } from '@/tests/test-utils'

describe('ActivitiesBar', () => {
  it('renders in minimized state by default', () => {
    renderWithProviders(<ActivitiesBar />)
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })

  it('expands when clicked', () => {
    renderWithProviders(<ActivitiesBar />)
    const button = screen.getByRole('button', { name: /expand activities/i })
    fireEvent.click(button)
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
  })

  it('shows personal mode activities by default', () => {
    renderWithProviders(<ActivitiesBar />)
    const button = screen.getByRole('button', { name: /expand activities/i })
    fireEvent.click(button)
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByText('View Stats')).toBeInTheDocument()
    expect(screen.queryByText('Log Group Transactions')).not.toBeInTheDocument()
  })

  it('switches to group mode activities when toggled', () => {
    renderWithProviders(<ActivitiesBar />)
    const button = screen.getByRole('button', { name: /expand activities/i })
    fireEvent.click(button)
    // Toggle to group mode (assuming there's a mode toggle button)
    const modeToggle = screen.getByRole('button', { name: /toggle mode/i })
    fireEvent.click(modeToggle)
    expect(screen.getByText('Log Group Transactions')).toBeInTheDocument()
    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })

  it('shows customization interface when in customize mode', () => {
    renderWithProviders(<ActivitiesBar />)
    // Open activities bar and enter customize mode
    const customizeButton = screen.getByRole('button', { name: /customize quick actions/i })
    fireEvent.click(customizeButton)
    
    // Check for customization interface elements
    expect(screen.getByText('Customize Quick Actions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close customization mode/i })).toBeInTheDocument()
    
    // Check for add/remove buttons on activities
    const addButtons = screen.getAllByRole('button', { name: /add .*/i })
    expect(addButtons.length).toBeGreaterThan(0)
  })

  it('closes on overlay click', () => {
    renderWithProviders(<ActivitiesBar />)
    const button = screen.getByRole('button', { name: /expand activities/i })
    fireEvent.click(button)
    
    const overlay = screen.getByRole('presentation')
    fireEvent.click(overlay)
    
    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })
}) 