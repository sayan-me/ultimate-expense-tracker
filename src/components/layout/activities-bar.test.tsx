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

  it('has accessible buttons for all activities', () => {
    renderWithProviders(<ActivitiesBar />)
    const button = screen.getByRole('button', { name: /expand activities/i })
    fireEvent.click(button)
    const activityButtons = screen.getAllByRole('button')
    expect(activityButtons.length).toBeGreaterThan(1) // Including the expand button
  })
}) 