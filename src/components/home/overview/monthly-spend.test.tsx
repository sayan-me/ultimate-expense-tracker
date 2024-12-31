import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { MonthlySpend } from './monthly-spend'
import { renderWithProviders } from '@/tests/test-utils'

describe('MonthlySpend', () => {
  it('renders monthly spend section', () => {
    renderWithProviders(<MonthlySpend />)
    expect(screen.getByText('Monthly Spend vs Budget')).toBeInTheDocument()
  })

  it('displays spent and budget amounts', () => {
    renderWithProviders(<MonthlySpend />)
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
  })

  it('shows percentage used', () => {
    renderWithProviders(<MonthlySpend />)
    expect(screen.getByText('60% used')).toBeInTheDocument()
  })

  it('displays loading skeletons when isLoading is true', () => {
    renderWithProviders(<MonthlySpend isLoading={true} />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-spent')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-budget')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-progress')).toBeInTheDocument()
  })

  it('does not show spend data while loading', () => {
    renderWithProviders(<MonthlySpend isLoading={true} />)
    expect(screen.queryByText('Monthly Spend vs Budget')).not.toBeInTheDocument()
    expect(screen.queryByText('$1,200.00')).not.toBeInTheDocument()
    expect(screen.queryByText('$2,000.00')).not.toBeInTheDocument()
  })
}) 