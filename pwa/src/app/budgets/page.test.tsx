import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BudgetsPage from './page'

const mockSetBudget = vi.fn()
const mockDeleteBudget = vi.fn()
let mockOverallBudget: { id: number; amount: number } | undefined
let mockCategoryBudgets: Record<string, { id: number; amount: number } | undefined>
let mockTransactions: Array<{ type: 'income' | 'expense'; amount: number; date: Date; category: string }>

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { transactions: mockTransactions },
    categories: {
      categories: [
        { id: 1, name: 'Food & Dining', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense' },
        { id: 2, name: 'Transportation', icon: 'car', color: '#3b82f6', isDefault: true, type: 'expense' },
      ],
    },
    budgets: {
      useOverallBudget: () => mockOverallBudget,
      useCategoryBudget: (category: string) => mockCategoryBudgets[category],
      setBudget: mockSetBudget,
      deleteBudget: mockDeleteBudget,
    },
  }),
}))

describe('BudgetsPage', () => {
  const now = new Date()

  beforeEach(() => {
    mockSetBudget.mockReset()
    mockSetBudget.mockResolvedValue(1)
    mockDeleteBudget.mockReset()
    mockOverallBudget = undefined
    mockCategoryBudgets = {}
    mockTransactions = [
      { type: 'expense', amount: 10000, date: now, category: 'Food & Dining' }, // $100.00
    ]
  })

  it('renders the page title', () => {
    render(<BudgetsPage />)
    // level: 1, not a loose /budgets/i match — "Category Budgets" below
    // it also matches that regex.
    expect(screen.getByRole('heading', { name: 'Budgets', level: 1 })).toBeInTheDocument()
  })

  it('lists every category for setting a per-category budget', () => {
    render(<BudgetsPage />)
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
  })

  it('shows an input to set the overall budget when none exists', () => {
    render(<BudgetsPage />)
    expect(screen.getByLabelText(/overall monthly budget/i)).toBeInTheDocument()
  })

  it('saves a new overall budget via setBudget(null, amountInCents)', async () => {
    const user = userEvent.setup()
    render(<BudgetsPage />)

    await user.type(screen.getByLabelText(/overall monthly budget/i), '500')
    await user.click(screen.getByRole('button', { name: /save overall budget/i }))

    await waitFor(() => expect(mockSetBudget).toHaveBeenCalledWith(null, 50000))
  })

  it('shows current spend and percentage once an overall budget exists', () => {
    mockOverallBudget = { id: 1, amount: 20000 } // $200, spend is $100 = 50%
    render(<BudgetsPage />)
    expect(screen.getByText('50% used')).toBeInTheDocument()
  })

  it('saves a per-category budget via setBudget(categoryName, amountInCents)', async () => {
    const user = userEvent.setup()
    render(<BudgetsPage />)

    // Exact match: a loose /budget for food & dining/i regex also
    // matches the Save button's aria-label ("Save budget for Food &
    // Dining"), since getByLabelText considers aria-label too.
    const input = screen.getByLabelText('Budget for Food & Dining')
    await user.type(input, '150')
    await user.click(screen.getByRole('button', { name: /save budget for food & dining/i }))

    await waitFor(() => expect(mockSetBudget).toHaveBeenCalledWith('Food & Dining', 15000))
  })

  it('shows spend vs budget for a category that has a budget set', () => {
    mockCategoryBudgets['Food & Dining'] = { id: 2, amount: 20000 } // $200, spend $100 = 50%
    render(<BudgetsPage />)
    // Scoped to this category's own progress text, not the overall one
    const section = screen.getByText('Food & Dining').closest('div')!
    expect(section.textContent).toContain('50%')
  })

  it('does not show a clear button when no overall budget is set', () => {
    render(<BudgetsPage />)
    expect(screen.queryByRole('button', { name: /clear overall budget/i })).not.toBeInTheDocument()
  })

  it('clears the overall budget via deleteBudget(id)', async () => {
    const user = userEvent.setup()
    mockOverallBudget = { id: 1, amount: 20000 }
    render(<BudgetsPage />)

    await user.click(screen.getByRole('button', { name: /clear overall budget/i }))

    await waitFor(() => expect(mockDeleteBudget).toHaveBeenCalledWith(1))
  })

  it('does not show a clear button for a category with no budget set', () => {
    render(<BudgetsPage />)
    expect(
      screen.queryByRole('button', { name: /clear budget for food & dining/i })
    ).not.toBeInTheDocument()
  })

  it('clears a category budget via deleteBudget(id)', async () => {
    const user = userEvent.setup()
    mockCategoryBudgets['Food & Dining'] = { id: 2, amount: 20000 }
    render(<BudgetsPage />)

    await user.click(screen.getByRole('button', { name: /clear budget for food & dining/i }))

    await waitFor(() => expect(mockDeleteBudget).toHaveBeenCalledWith(2))
  })
})
