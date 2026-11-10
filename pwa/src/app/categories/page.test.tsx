import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoriesPage from './page'
import type { Category } from '@/lib/db'

const mockAddCategory = vi.fn()
const mockUpdateCategory = vi.fn()
const mockDeleteCategory = vi.fn()
let mockCategories: Category[]

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    categories: {
      categories: mockCategories,
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory,
    },
  }),
}))

function category(overrides: Partial<Category> = {}): Category {
  return { id: 1, name: 'Food & Dining', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense', createdAt: new Date(), ...overrides }
}

describe('CategoriesPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockAddCategory.mockReset()
    mockAddCategory.mockResolvedValue(2)
    mockUpdateCategory.mockReset()
    mockUpdateCategory.mockResolvedValue(undefined)
    mockDeleteCategory.mockReset()
    mockDeleteCategory.mockResolvedValue(undefined)
    mockCategories = [category()]
  })

  it('renders the page title', () => {
    render(<CategoriesPage />)
    expect(screen.getByRole('heading', { name: 'Categories', level: 1 })).toBeInTheDocument()
  })

  it('lists every category with a default badge where applicable', () => {
    mockCategories = [
      category({ id: 1, name: 'Food & Dining', isDefault: true }),
      category({ id: 2, name: 'Side Hustle', isDefault: false, type: 'income' }),
    ]
    render(<CategoriesPage />)
    const list = within(screen.getByTestId('category-list'))
    expect(list.getByText('Food & Dining')).toBeInTheDocument()
    expect(list.getByText('Side Hustle')).toBeInTheDocument()
    expect(list.getAllByText('Default')).toHaveLength(1)
  })

  it('does not offer edit or delete controls for default categories', () => {
    mockCategories = [category({ id: 1, name: 'Food & Dining', isDefault: true })]
    render(<CategoriesPage />)
    const list = within(screen.getByTestId('category-list'))
    expect(list.queryByRole('button', { name: /edit food & dining/i })).not.toBeInTheDocument()
    expect(list.queryByRole('button', { name: /delete food & dining/i })).not.toBeInTheDocument()
  })

  it('creates a new category via the add-category form', async () => {
    const u = user()
    render(<CategoriesPage />)

    await u.type(screen.getByLabelText(/category name/i), 'Side Hustle')
    await u.click(screen.getByRole('button', { name: /add category/i }))

    await waitFor(() =>
      expect(mockAddCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Side Hustle', type: 'expense', isDefault: false })
      )
    )
  })

  it('edits a custom category', async () => {
    const u = user()
    mockCategories = [category({ id: 2, name: 'Side Hustle', isDefault: false, type: 'income' })]
    render(<CategoriesPage />)

    await u.click(screen.getByRole('button', { name: /edit side hustle/i }))
    const nameInput = screen.getByLabelText(/edit category name/i)
    await u.clear(nameInput)
    await u.type(nameInput, 'Freelance Income')
    await u.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockUpdateCategory).toHaveBeenCalledWith(2, expect.objectContaining({ name: 'Freelance Income' }))
    )
  })

  it('deletes a custom category after confirming', async () => {
    const u = user()
    mockCategories = [category({ id: 2, name: 'Side Hustle', isDefault: false, type: 'income' })]
    render(<CategoriesPage />)

    await u.click(screen.getByRole('button', { name: /delete side hustle/i }))
    await u.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(mockDeleteCategory).toHaveBeenCalledWith(2))
  })

  it('shows an error instead of crashing when deleting a category still in use', async () => {
    const u = user()
    mockDeleteCategory.mockRejectedValue(new Error('Cannot delete category "Side Hustle" - it is used by 3 transaction(s)'))
    mockCategories = [category({ id: 2, name: 'Side Hustle', isDefault: false, type: 'income' })]
    render(<CategoriesPage />)

    await u.click(screen.getByRole('button', { name: /delete side hustle/i }))
    await u.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(await screen.findByText(/used by 3 transaction/i)).toBeInTheDocument()
  })
})
