import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { QuickActions } from './quick-actions'
import { renderWithProviders } from '@/tests/test-utils'

describe('QuickActions', () => {
  it('renders section title', () => {
    renderWithProviders(<QuickActions />)
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('renders all default quick actions', () => {
    renderWithProviders(<QuickActions />)
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByText('Set Budget')).toBeInTheDocument()
    expect(screen.getByText('View Stats')).toBeInTheDocument()
  })

  it('displays customize button', () => {
    renderWithProviders(<QuickActions />)
    expect(screen.getByText('Customize')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /customize quick actions/i })).toBeInTheDocument()
  })

  it('has accessible buttons for all actions', () => {
    renderWithProviders(<QuickActions />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(10) // 9 default actions + customize button
  })

  it('opens customize modal when customize button is clicked', () => {
    renderWithProviders(<QuickActions />)
    const customizeButton = screen.getByRole('button', { name: /customize quick actions/i })
    fireEvent.click(customizeButton)
    // Add assertions for customize modal
  })

  it('triggers action when quick action button is clicked', () => {
    renderWithProviders(<QuickActions />)
    const logTransactionButton = screen.getByRole('button', { name: /log transactions/i })
    fireEvent.click(logTransactionButton)
    // Add assertions for action trigger
  })
}) 