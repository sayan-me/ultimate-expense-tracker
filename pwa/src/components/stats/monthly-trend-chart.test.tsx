import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlyTrendChart } from './monthly-trend-chart'
import type { MonthlyTotal } from '@/lib/stats'

function month(overrides: Partial<MonthlyTotal> = {}): MonthlyTotal {
  return { month: 0, year: 2026, income: 0, expense: 0, net: 0, ...overrides }
}

describe('MonthlyTrendChart', () => {
  it('shows a message instead of an empty chart when there is no data', () => {
    render(<MonthlyTrendChart months={[month(), month(), month()]} />)
    expect(screen.getByText(/no activity/i)).toBeInTheDocument()
  })

  it('renders a legend naming both series — color is never the only identity signal', () => {
    render(<MonthlyTrendChart months={[month({ income: 1000 })]} />)
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Expense')).toBeInTheDocument()
  })

  it('labels each month column with a short month name', () => {
    render(<MonthlyTrendChart months={[month({ month: 0, year: 2026, income: 500 }), month({ month: 1, year: 2026, expense: 300 })]} />)
    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
  })

  it('gives each bar an accessible, non-color-dependent title with the exact amount', () => {
    render(<MonthlyTrendChart months={[month({ month: 0, year: 2026, income: 12345, expense: 6789 })]} />)
    expect(screen.getByTitle(/income.*\$123\.45/i)).toBeInTheDocument()
    expect(screen.getByTitle(/expense.*\$67\.89/i)).toBeInTheDocument()
  })

  it('scales bar heights relative to the largest value across all months', () => {
    const { container } = render(
      <MonthlyTrendChart months={[month({ month: 0, income: 10000 }), month({ month: 1, income: 5000 })]} />
    )
    const incomeBars = container.querySelectorAll('[data-series="income"]')
    expect((incomeBars[0] as HTMLElement).style.height).toBe('100%')
    expect((incomeBars[1] as HTMLElement).style.height).toBe('50%')
  })
})
