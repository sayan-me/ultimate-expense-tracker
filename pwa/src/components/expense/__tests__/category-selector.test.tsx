import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategorySelector } from '../category-selector'
import { renderWithProviders } from '@/tests/test-utils'

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
  addCategory: vi.fn().mockResolvedValue(undefined)
}

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    categories: mockCategories
  }),
  DBProvider: ({ children }: { children: React.ReactNode }) => children
}))

describe('CategorySelector Component', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    type: 'expense' as const,
    value: '',
    onChange: mockOnChange,
    placeholder: 'Select or type category...'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders input with placeholder', () => {
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Select or type category...')
    })

    it('displays selected category value in input', () => {
      renderWithProviders(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('Food & Dining')
    })

    it('shows dropdown toggle button', () => {
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button', { name: /toggle/i }) || 
                           screen.getAllByRole('button').find(btn => btn.querySelector('[class*="chevron"]'))
      expect(toggleButton).toBeInTheDocument()
    })

    it('shows clear button when value is selected', () => {
      renderWithProviders(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const clearButton = screen.getByRole('button', { name: /clear/i }) ||
                         screen.getAllByRole('button').find(btn => btn.querySelector('[class*="x"]'))
      expect(clearButton).toBeInTheDocument()
    })
  })

  describe('Dropdown Functionality', () => {
    it('opens dropdown when input is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
        expect(screen.getByText('Transportation')).toBeInTheDocument()
      })
    })

    it('opens dropdown when toggle button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      const toggleButton = buttons.find(btn => btn.querySelector('[class*="chevron"]'))
      
      if (toggleButton) {
        await user.click(toggleButton)
        
        await waitFor(() => {
          expect(screen.getByText('Food & Dining')).toBeInTheDocument()
        })
      }
    })

    it('filters categories correctly by type - expense', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} type="expense" />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
        expect(screen.getByText('Transportation')).toBeInTheDocument()
        expect(screen.getByText('Both Type')).toBeInTheDocument()
        expect(screen.queryByText('Salary')).not.toBeInTheDocument()
      })
    })

    it('filters categories correctly by type - income', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} type="income" />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
        expect(screen.getByText('Both Type')).toBeInTheDocument()
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
        expect(screen.queryByText('Transportation')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      await user.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Selection', () => {
    it('selects category and updates value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      const categoryButton = screen.getByText('Food & Dining').closest('button')
      if (categoryButton) {
        await user.click(categoryButton)
      }
      
      expect(mockOnChange).toHaveBeenCalledWith('Food & Dining')
    })

    it('shows visual feedback (checkmark) for selected category', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const categoryElement = screen.getByText('Food & Dining')
        const checkIcon = categoryElement.closest('button')?.querySelector('[class*="check"]')
        expect(checkIcon).toBeInTheDocument()
      })
    })

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      const categoryButton = screen.getByText('Food & Dining').closest('button')
      if (categoryButton) {
        await user.click(categoryButton)
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Transportation')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering Functionality', () => {
    it('input is focusable and accepts typing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'Food')
      
      expect(input).toHaveValue('Food')
    })

    it('filters categories as user types', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'Transport')
      
      await waitFor(() => {
        expect(screen.getByText('Transportation')).toBeInTheDocument()
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })

    it('shows "no categories found" when filter has no matches', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'NonExistent')
      
      await waitFor(() => {
        expect(screen.getByText('No categories found.')).toBeInTheDocument()
      })
    })

    it('selects first match on Enter key', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'Food')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith('Food & Dining')
    })
  })

  describe('Scrolling Behavior', () => {
    it('dropdown has scrollable container', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const scrollableContainer = screen.getByText('Food & Dining')
          .closest('[class*="overflow-y-auto"]')
        expect(scrollableContainer).toBeInTheDocument()
      })
    })

    it('dropdown has proper height constraint', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const container = screen.getByText('Food & Dining')
          .closest('[class*="max-h-64"]')
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Visual Indicators', () => {
    it('displays color dots for each category', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const foodElement = screen.getByText('Food & Dining')
        const colorDot = foodElement.closest('button')?.querySelector('div[style*="background-color"]')
        expect(colorDot).toBeInTheDocument()
      })
    })

    it('shows "Default" badge for default categories', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const defaultBadges = screen.getAllByText('Default')
        expect(defaultBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Clear Functionality', () => {
    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const buttons = screen.getAllByRole('button')
      const clearButton = buttons.find(btn => btn.querySelector('[class*="x"]'))
      
      if (clearButton) {
        await user.click(clearButton)
        expect(mockOnChange).toHaveBeenCalledWith('')
      }
    })

    it('hides clear button when no value is selected', () => {
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      const clearButton = buttons.find(btn => btn.querySelector('[class*="x"]'))
      expect(clearButton).toBeUndefined()
    })
  })

  describe('Loading States', () => {
    it('handles loading state when categories are undefined', async () => {
      const loadingMockCategories = { categories: undefined, addCategory: vi.fn() }
      
      vi.doMock('@/contexts/db-context', () => ({
        useDB: () => ({ categories: loadingMockCategories })
      }))
      
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Loading categories...')).toBeInTheDocument()
      })
    })

    it('handles empty categories array gracefully', async () => {
      mockCategories.categories = []
      
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('No categories found.')).toBeInTheDocument()
      })
      
      // Restore mock data
      mockCategories.categories = [
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
      ]
    })
  })

  describe('Category Creation', () => {
    it('shows create category option in dropdown', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Create new category')).toBeInTheDocument()
      })
    })

    it('opens create dialog when create option is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText('Create new category')).toBeInTheDocument()
      })
      
      const createButton = screen.getByText('Create new category').closest('button')
      if (createButton) {
        await user.click(createButton)
      }
      
      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter category name...')).toBeInTheDocument()
      })
    })

    it('shows create option with typed name when no matches found', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'NewCategory')
      
      await waitFor(() => {
        expect(screen.getByText(/Create "NewCategory"/)).toBeInTheDocument()
      })
    })

    it('creates new category on Enter when no matches exist', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.type(input, 'NewCategory')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument()
      })
    })

    it('closes dropdown when opening create dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      const createButton = screen.getByText('Create new category').closest('button')
      if (createButton) {
        await user.click(createButton)
      }
      
      await waitFor(() => {
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
      })
    })
  })

  describe('Focus Management', () => {
    it('input receives focus when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      expect(document.activeElement).toBe(input)
    })

    it('text is selected when dropdown opens with existing value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.click(input)
      
      // Check that text is selected (selectionStart should be 0 and selectionEnd should be text length)
      expect(input.selectionStart).toBe(0)
      expect(input.selectionEnd).toBe('Food & Dining'.length)
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined value prop gracefully', () => {
      renderWithProviders(<CategorySelector type="expense" value="" onChange={mockOnChange} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue('')
    })

    it('handles very long category names', async () => {
      const longCategory = {
        id: 6,
        name: 'This Is A Very Long Category Name That Should Be Handled Properly',
        icon: 'star',
        color: '#000000',
        isDefault: false,
        type: 'expense',
        createdAt: new Date()
      }
      
      mockCategories.categories.push(longCategory)
      
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        expect(screen.getByText(longCategory.name)).toBeInTheDocument()
      })
      
      // Cleanup
      mockCategories.categories.pop()
    })

    it('maintains dropdown positioning', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector {...defaultProps} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const dropdown = screen.getByText('Food & Dining').closest('[class*="absolute"]')
        expect(dropdown).toHaveClass('absolute')
      })
    })
  })
})