import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Overview } from './overview'
import { renderWithProviders } from '@/tests/test-utils'

describe('Overview', () => {
  it('renders financial overview section', () => {
    renderWithProviders(<Overview />)
    expect(screen.getByLabelText('Financial overview')).toBeInTheDocument()
  })

  it('shows personal mode components by default', () => {
    renderWithProviders(<Overview />)
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
    expect(screen.getByText('Monthly Spend vs Budget')).toBeInTheDocument()
    expect(screen.getByText('Recent Expenses')).toBeInTheDocument()
  })

  it('passes loading state to child components', () => {
    renderWithProviders(<Overview />)
    // Initially not loading
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
    expect(screen.getByText('Monthly Spend vs Budget')).toBeInTheDocument()
    expect(screen.getByText('Recent Expenses')).toBeInTheDocument()
  })

  it('does not render group mode components in personal mode', () => {
    renderWithProviders(<Overview />)
    expect(screen.queryByText('Group Stats')).not.toBeInTheDocument()
    expect(screen.queryByText('Outstanding Balances')).not.toBeInTheDocument()
  })

  describe('when loading', () => {
    it('shows loading skeletons for all sections', () => {
      // Mock useState to return isLoading as true
      vi.spyOn(React, 'useState').mockImplementationOnce(() => ['personal', vi.fn()])
      vi.spyOn(React, 'useState').mockImplementationOnce(() => [true, vi.fn()])
      
      renderWithProviders(<Overview />)
      const section = screen.getByLabelText('Financial overview')
      expect(section).toBeInTheDocument()
      
      // Check for three skeleton elements
      const skeletons = screen.getAllByRole('generic').filter(el => 
        el.className.includes('skeleton')
      )
      expect(skeletons).toHaveLength(3)
      
      // Verify skeleton dimensions
      expect(skeletons[0]).toHaveClass('h-[160px]') // CurrentBalance skeleton
      expect(skeletons[1]).toHaveClass('h-[120px]') // MonthlySpend skeleton
      expect(skeletons[2]).toHaveClass('h-[280px]') // RecentExpenses skeleton
    })
  })
}) 