import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { RecentExpenses } from './recent-expenses'
import { renderWithProviders } from '@/tests/test-utils'

describe('RecentExpenses', () => {
  it('renders recent expenses section', () => {
    renderWithProviders(<RecentExpenses />)
    expect(screen.getByText('Recent Expenses')).toBeInTheDocument()
  })

  it('displays view all button', () => {
    renderWithProviders(<RecentExpenses />)
    expect(screen.getByRole('button', { name: /view all expenses/i })).toBeInTheDocument()
  })

  it('shows mock expenses with correct details', () => {
    renderWithProviders(<RecentExpenses />)
    expect(screen.getByText('Lunch at Subway')).toBeInTheDocument()
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('$42.50')).toBeInTheDocument()
  })

  it('displays loading skeletons when isLoading is true', () => {
    renderWithProviders(<RecentExpenses isLoading={true} />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('does not show expense data while loading', () => {
    renderWithProviders(<RecentExpenses isLoading={true} />)
    expect(screen.queryByText('Recent Expenses')).not.toBeInTheDocument()
    expect(screen.queryByText('Lunch at Subway')).not.toBeInTheDocument()
  })
}) 