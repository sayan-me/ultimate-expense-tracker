import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategorySplitBar } from './category-split-bar'
import type { CategoryBreakdownEntry } from '@/lib/stats'

describe('CategorySplitBar', () => {
  it('shows a message instead of an empty bar when there is no spend', () => {
    render(<CategorySplitBar entries={[]} />)
    expect(screen.getByText(/no expenses/i)).toBeInTheDocument()
  })

  it('lists each category with its name, amount, and share of the total', () => {
    const entries: CategoryBreakdownEntry[] = [
      { category: 'Food & Dining', amount: 7500, color: '#ef4444' },
      { category: 'Transportation', amount: 2500, color: '#3b82f6' },
    ]
    render(<CategorySplitBar entries={entries} />)

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('$75.00')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('never relies on color alone — every segment has a named, non-color accessible label', () => {
    const entries: CategoryBreakdownEntry[] = [{ category: 'Food & Dining', amount: 1000, color: '#ef4444' }]
    render(<CategorySplitBar entries={entries} />)
    expect(screen.getByTitle(/food & dining.*\$10\.00/i)).toBeInTheDocument()
  })

  it('renders the split bar with each segment sized to its share of the total width', () => {
    const entries: CategoryBreakdownEntry[] = [
      { category: 'Food & Dining', amount: 3000, color: '#ef4444' },
      { category: 'Transportation', amount: 1000, color: '#3b82f6' },
    ]
    const { container } = render(<CategorySplitBar entries={entries} />)
    const segments = container.querySelectorAll('[data-segment]')
    expect(segments).toHaveLength(2)
    expect((segments[0] as HTMLElement).style.width).toBe('75%')
    expect((segments[1] as HTMLElement).style.width).toBe('25%')
  })
})
