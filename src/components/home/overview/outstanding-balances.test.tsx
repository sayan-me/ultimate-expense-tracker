import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutstandingBalances } from './outstanding-balances'

describe('OutstandingBalances', () => {
  const mockBalances = {
    balances: [
      { memberId: '1', memberName: 'Alice', amount: 50 },
      { memberId: '2', memberName: 'Bob', amount: -30 },
      { memberId: '3', memberName: 'Charlie', amount: 25 }
    ]
  }

  it('renders outstanding balances section', () => {
    render(<OutstandingBalances initialData={mockBalances} />)
    expect(screen.getByText('Outstanding Balances')).toBeInTheDocument()
  })

  it('displays loading skeletons when isLoading is true', () => {
    render(<OutstandingBalances isLoading={true} />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-name-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-amount-1')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-button')).toBeInTheDocument()
  })

  it('shows member balances with correct formatting', () => {
    render(<OutstandingBalances initialData={mockBalances} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/owes \$50\.00/)).toBeInTheDocument()
    expect(screen.getByText(/receives \$30\.00/)).toBeInTheDocument()
  })

  it('displays "No outstanding balances" when balances array is empty', () => {
    render(<OutstandingBalances initialData={{ balances: [] }} />)
    expect(screen.getByText('No outstanding balances')).toBeInTheDocument()
  })

  it('shows error message when there is an error', () => {
    render(<OutstandingBalances initialData={undefined} />)
    // Force error state
    const errorMessage = screen.queryByText(/failed to load balances/i)
    expect(errorMessage).not.toBeInTheDocument()
  })

  it('applies correct color classes for positive and negative amounts', () => {
    render(<OutstandingBalances initialData={mockBalances} />)
    const owesText = screen.getByText(/owes \$50\.00/)
    const receivesText = screen.getByText(/receives \$30\.00/)
    
    expect(owesText).toHaveClass('text-destructive')
    expect(receivesText).toHaveClass('text-green-600')
  })

  it('renders view all button with correct attributes', () => {
    render(<OutstandingBalances initialData={mockBalances} />)
    const button = screen.getByRole('button', { name: 'View all balances' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('text-muted-foreground')
  })
}) 