import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupStats } from './group-stats'

describe('GroupStats', () => {
  const mockData = {
    totalSpending: 1500,
    monthlyBudget: 2000,
    categories: [
      { name: 'Food', amount: 500 },
      { name: 'Transport', amount: 300 }
    ]
  }

  it('renders loading skeleton when isLoading is true', () => {
    render(<GroupStats isLoading />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders group stats with initial data', () => {
    render(<GroupStats initialData={mockData} />)
    expect(screen.getByText('$1,500')).toBeInTheDocument()
    expect(screen.getByText('of $2,000 budget')).toBeInTheDocument()
  })

  it('renders progress bar with correct percentage', () => {
    render(<GroupStats initialData={mockData} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveStyle({ width: '75%' })
    expect(progressBar).toHaveAttribute('aria-valuenow', '1500')
    expect(progressBar).toHaveAttribute('aria-valuemax', '2000')
  })

  it('renders category view button', () => {
    render(<GroupStats initialData={mockData} />)
    expect(screen.getByRole('button', { 
      name: /view category-wise spending/i 
    })).toBeInTheDocument()
  })

  it('handles zero budget case gracefully', () => {
    render(<GroupStats initialData={{ 
      ...mockData, 
      monthlyBudget: 0 
    }} />)
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '100%' })
  })

  it('handles errors gracefully', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockData = {
      totalSpending: undefined,
      monthlyBudget: 2000,
      categories: []
    }

    render(<GroupStats initialData={mockData} />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('shows error message when category view is clicked', async () => {
    render(<GroupStats initialData={{
      totalSpending: 1500,
      monthlyBudget: 2000,
      categories: []
    }} />)

    const button = screen.getByRole('button', { 
      name: /view category-wise spending/i 
    })
    fireEvent.click(button)

    expect(screen.getByText(/Category view not implemented yet/i)).toBeInTheDocument()
  })
}) 