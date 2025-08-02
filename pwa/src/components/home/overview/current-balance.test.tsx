import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { CurrentBalance } from './current-balance'
import { renderWithProviders } from '@/tests/test-utils'

describe('CurrentBalance', () => {
  it('renders total balance section', () => {
    renderWithProviders(<CurrentBalance />)
    expect(screen.getByText('Total Balance')).toBeInTheDocument()
  })

  it('displays formatted currency amount', () => {
    renderWithProviders(<CurrentBalance />)
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('shows "Across all accounts" text', () => {
    renderWithProviders(<CurrentBalance />)
    expect(screen.getByText('Across all accounts')).toBeInTheDocument()
  })

  it('displays loading skeletons when isLoading is true', () => {
    renderWithProviders(<CurrentBalance isLoading={true} />)
    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-balance')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton-subtitle')).toBeInTheDocument()
  })

  it('does not show balance data while loading', () => {
    renderWithProviders(<CurrentBalance isLoading={true} />)
    expect(screen.queryByText('Total Balance')).not.toBeInTheDocument()
    expect(screen.queryByText('$5,000.00')).not.toBeInTheDocument()
  })
}) 