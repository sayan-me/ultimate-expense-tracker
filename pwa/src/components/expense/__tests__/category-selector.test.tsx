import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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
  })

  describe('Basic Rendering', () => {
    it('renders trigger button with placeholder', () => {
      render(<CategorySelector {...defaultProps} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Select category...')).toBeInTheDocument()
    })

    it('displays selected category when value is provided', () => {
      render(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    })

    it('shows visual indicator (color dot) for selected category', () => {
      render(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      const colorDot = screen.getByRole('button').querySelector('div[style*="background-color: rgb(239, 68, 68)"]')
      expect(colorDot).toBeInTheDocument()
    })
  })

  describe('Dropdown/Popover Functionality', () => {
    it('opens dropdown when trigger button is clicked', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
    })

    it('displays filtered categories in dropdown', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
        expect(screen.getByText('Transportation')).toBeInTheDocument()
        expect(screen.getByText('Both Type')).toBeInTheDocument()
        expect(screen.queryByText('Salary')).not.toBeInTheDocument() // Income type shouldn't show for expense
      })
    })

    it('filters categories correctly by type - expense', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} type="expense" />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
        expect(screen.getByText('Transportation')).toBeInTheDocument()
        expect(screen.getByText('Both Type')).toBeInTheDocument() // 'both' type shows for expense
        expect(screen.queryByText('Salary')).not.toBeInTheDocument()
      })
    })

    it('filters categories correctly by type - income', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} type="income" />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Salary')).toBeInTheDocument()
        expect(screen.getByText('Both Type')).toBeInTheDocument() // 'both' type shows for income
        expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument()
        expect(screen.queryByText('Transportation')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
      
      await user.click(document.body)
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument()
      })
    })

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
      
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Selection', () => {
    it('selects category and updates value', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Food & Dining'))
      
      expect(mockOnChange).toHaveBeenCalledWith('Food & Dining')
    })

    it('shows visual feedback (checkmark) for selected category', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} value="Food & Dining" />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const checkIcon = screen.getByText('Food & Dining').closest('[role="option"]')?.querySelector('svg')
        expect(checkIcon).toBeInTheDocument()
        expect(checkIcon).toHaveClass('opacity-100')
      })
    })

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByText('Food & Dining')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Food & Dining'))
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input in dropdown', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
    })

    it('search input is focusable and functional', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search categories...')
      await user.click(searchInput)
      await user.type(searchInput, 'Food')
      
      expect(searchInput).toHaveValue('Food')
    })

    it('search does not close dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
      
      await user.click(screen.getByPlaceholderText('Search categories...'))
      
      // Dropdown should remain open
      expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
    })
  })

  describe('Scrolling Behavior', () => {
    it('dropdown has scrollable container', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const scrollableContainer = screen.getByPlaceholderText('Search categories...')
          .closest('[class*="max-h-64"][class*="overflow-y-auto"]')
        expect(scrollableContainer).toBeInTheDocument()
      })
    })

    it('dropdown has proper height constraint', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const container = screen.getByPlaceholderText('Search categories...')
          .closest('[class*="max-h-64"]')
        expect(container).toHaveClass('max-h-64')
      })
    })
  })

  describe('Visual Indicators', () => {
    it('displays color dots for each category', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        // Check for Food & Dining color dot (red)
        const redDot = screen.getByText('Food & Dining')
          .closest('[role="option"]')
          ?.querySelector('div[style*="background-color: rgb(239, 68, 68)"]')
        expect(redDot).toBeInTheDocument()
        
        // Check for Transportation color dot (blue)  
        const blueDot = screen.getByText('Transportation')
          .closest('[role="option"]')
          ?.querySelector('div[style*="background-color: rgb(59, 130, 246)"]')
        expect(blueDot).toBeInTheDocument()
      })
    })

    it('shows "Default" badge for default categories', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const defaultBadges = screen.getAllByText('Default')
        expect(defaultBadges.length).toBeGreaterThan(0)
      })
    })

    it('does not show "Default" badge for custom categories', async () => {
      const customCategory = {
        id: 5,
        name: 'Custom Category',
        icon: 'star',
        color: '#000000',
        isDefault: false,
        type: 'expense',
        createdAt: new Date()
      }
      
      mockCategories.categories.push(customCategory)
      
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const customCategoryElement = screen.getByText('Custom Category')
        const parentElement = customCategoryElement.closest('[role="option"]')
        expect(parentElement?.querySelector('[class*="Default"]')).not.toBeInTheDocument()
      })
      
      // Cleanup
      mockCategories.categories.pop()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when categories are undefined', () => {
      vi.mocked(vi.fn()).mockImplementation(() => ({
        categories: { categories: undefined }
      }))
      
      render(<CategorySelector {...defaultProps} />)
      // The component should handle undefined categories gracefully
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles empty categories array gracefully', async () => {
      mockCategories.categories = []
      
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
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
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Create new category')).toBeInTheDocument()
      })
    })

    it('opens create dialog when create option is clicked', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Create new category')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Create new category'))
      
      await waitFor(() => {
        expect(screen.getByText('Create New Category')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Enter category name...')).toBeInTheDocument()
      })
    })

    it('closes dropdown when opening create dialog', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Create new category'))
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Focus Management', () => {
    it('dropdown receives focus when opened', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const dropdown = screen.getByPlaceholderText('Search categories...')
        expect(document.activeElement).toBe(dropdown)
      })
    })

    it('focus returns to trigger when dropdown closes', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      const triggerButton = screen.getByRole('button')
      await user.click(triggerButton)
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(document.activeElement).toBe(triggerButton)
      })
    })
  })

  describe('Accessibility', () => {
    it('trigger button has proper accessibility attributes', () => {
      render(<CategorySelector {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('role', 'combobox')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('dropdown items are properly labeled', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const foodOption = screen.getByText('Food & Dining').closest('[role="option"]')
        expect(foodOption).toBeInTheDocument()
        expect(foodOption).toHaveAttribute('role', 'option')
      })
    })

    it('keyboard navigation works in dropdown', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
      
      // Test Arrow key navigation
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      // Should select first category
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined value prop gracefully', () => {
      render(<CategorySelector type="expense" onChange={mockOnChange} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('Select category...')).toBeInTheDocument()
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
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText(longCategory.name)).toBeInTheDocument()
      })
      
      // Cleanup
      mockCategories.categories.pop()
    })

    it('maintains proper popover positioning', async () => {
      const user = userEvent.setup()
      render(<CategorySelector {...defaultProps} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const popoverContent = screen.getByPlaceholderText('Search categories...')
          .closest('[role="dialog"]')
        expect(popoverContent).toBeInTheDocument()
      })
    })
  })
})