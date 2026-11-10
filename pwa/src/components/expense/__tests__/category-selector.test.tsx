import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategorySelector } from '../category-selector'

// Mock the useDB hook
const mockCategories = {
  categories: [
    {
      id: 1,
      name: 'Food & Dining',
      icon: 'utensils',
      color: '#ef4444',
      isDefault: true,
      type: 'expense',
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Transportation',
      icon: 'car',
      color: '#3b82f6',
      isDefault: true,
      type: 'expense',
      createdAt: new Date()
    },
    {
      id: 3,
      name: 'Salary',
      icon: 'briefcase',
      color: '#059669',
      isDefault: true,
      type: 'income',
      createdAt: new Date()
    },
    {
      id: 4,
      name: 'Both Type',
      icon: 'star',
      color: '#8b5cf6',
      isDefault: false,
      type: 'both',
      createdAt: new Date()
    }
  ],
  addCategory: vi.fn()
}

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    categories: mockCategories
  })
}))

describe('CategorySelector Component', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    type: 'expense' as const,
    value: '',
    onChange: mockOnChange,
    placeholder: 'Select category...'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCategories.addCategory.mockReset()
  })

  const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByPlaceholderText('Select category...'))
    // The component focuses/selects its input ~50ms after opening; let that settle
    // so typed text isn't replaced by the selection.
    await new Promise((resolve) => setTimeout(resolve, 80))
  }

  describe('Basic Rendering', () => {
    it('renders text input with placeholder', () => {
      render(<CategorySelector {...defaultProps} />)
      expect(screen.getByPlaceholderText('Select category...')).toBeInTheDocument()
    })

    it('uses a default placeholder when none is provided', () => {
      render(<CategorySelector {...defaultProps} placeholder={undefined} />)
      expect(screen.getByPlaceholderText('Select or type category...')).toBeInTheDocument()
    })

    it('displays selected category value in the input', () => {
      render(<CategorySelector {...defaultProps} value="Food & Dining" />)
      expect(screen.getByDisplayValue('Food & Dining')).toBeInTheDocument()
    })

    it('does not show dropdown initially', () => {
      render(<CategorySelector {...defaultProps} />)
      expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
    })
  })

  describe('Dropdown Functionality', () => {
    it('opens dropdown when the input is clicked', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<div><CategorySelector {...defaultProps} /><button>outside</button></div>)
      await openDropdown(user)
      expect(screen.getByText('Food & Dining')).toBeInTheDocument()

      await user.click(screen.getByText('outside'))
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Filtering', () => {
    it('shows only expense and both-type categories for expenses', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} type="expense" />)
      await openDropdown(user)

      expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      expect(screen.getByText('Transportation')).toBeInTheDocument()
      expect(screen.getByText('Both Type')).toBeInTheDocument()
      expect(screen.queryByText('Salary')).not.toBeInTheDocument()
    })

    it('shows only income and both-type categories for income', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} type="income" />)
      await openDropdown(user)

      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Both Type')).toBeInTheDocument()
      expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('filters categories as the user types', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.type(screen.getByPlaceholderText('Select category...'), 'trans')

      expect(screen.getByText('Transportation')).toBeInTheDocument()
      expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
    })

    it('search is case insensitive', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.type(screen.getByPlaceholderText('Select category...'), 'FOOD')

      expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    })

    it('shows empty state and create option when nothing matches', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.type(screen.getByPlaceholderText('Select category...'), 'zzz')

      expect(screen.getByText('No categories found.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create "zzz"/ })).toBeInTheDocument()
    })
  })

  describe('Category Selection', () => {
    it('calls onChange and closes the dropdown when a category is clicked', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.click(screen.getByText('Transportation'))

      expect(mockOnChange).toHaveBeenCalledWith('Transportation')
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })

    it('selects the first match when Enter is pressed', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.type(screen.getByPlaceholderText('Select category...'), 'trans{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('Transportation')
    })

    it('clears the selection with the clear button', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} value="Food & Dining" />)

      // Buttons: [clear, toggle]
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      await user.click(buttons[0])

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('shows a check mark next to the selected category', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} value="Transportation" />)
      await user.click(screen.getByDisplayValue('Transportation'))

      // The dropdown renders in a portal (outside the render container) so
      // the clipping fix (M1) doesn't break it inside a scrollable dialog.
      expect(document.body.querySelectorAll('svg.lucide-check')).toHaveLength(1)
    })
  })

  describe('Visual Indicators', () => {
    it('shows a color dot for each category', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)

      const dots = document.body.querySelectorAll('div.rounded-full')
      // 3 expense/both categories
      expect(dots).toHaveLength(3)
      expect((dots[0] as HTMLElement).style.backgroundColor).toBe('rgb(239, 68, 68)')
    })

    it('shows the Default badge only for default categories', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)

      // Food & Dining and Transportation are default; Both Type is not
      expect(screen.getAllByText('Default')).toHaveLength(2)
    })
  })

  describe('Category Creation', () => {
    it('creates a new category via the dialog and selects it', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      mockCategories.addCategory.mockResolvedValue(undefined)
      render(<CategorySelector {...defaultProps} />)
      await openDropdown(user)
      await user.type(screen.getByPlaceholderText('Select category...'), 'Hobbies')
      await user.click(await screen.findByText(/Create "Hobbies"/))

      expect(await screen.findByText('Create New Category')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter category name...')).toHaveValue('Hobbies')

      await user.click(screen.getByRole('button', { name: 'Create Category' }))

      await waitFor(() => {
        expect(mockCategories.addCategory).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Hobbies', type: 'expense', isDefault: false })
        )
      })
      expect(mockOnChange).toHaveBeenCalledWith('Hobbies')
    })
  })
})
