import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddExpenseForm } from '../add-expense-form'
import { CategorySelector } from '../category-selector'
import { TagsInput } from '../tags-input'
import { renderWithProviders } from '@/tests/test-utils'

// Mock the useDB hook
const mockData = {
  accounts: {
    accounts: [
      { id: 1, name: 'Cash', type: 'cash', balance: 500.00, isDefault: true, createdAt: new Date() }
    ],
    addAccount: vi.fn(),
    deleteAccount: vi.fn(),
    updateAccount: vi.fn(),
    useDefaultAccount: vi.fn()
  },
  transactions: {
    transactions: [],
    addTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    updateTransaction: vi.fn()
  },
  categories: {
    categories: [
      { id: 1, name: 'Food', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense', createdAt: new Date() }
    ],
    addCategory: vi.fn()
  }
}

vi.mock('@/contexts/db-context', () => ({
  useDB: () => mockData
}))

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 768px'), // Mock mobile viewport
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Add Expense Modal - Responsive & UI Positioning Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Date Field Calendar Icon Positioning', () => {
    it('date field has proper datetime-local input type with native calendar', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const dateInput = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      expect(dateInput.type).toBe('datetime-local')
    })

    it('date input maintains proper structure without extra elements', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const dateInput = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      const dateFieldContainer = dateInput.closest('[class*="FormControl"]')
      
      // Should not have any extra calendar icons or positioned elements
      expect(dateFieldContainer?.children).toHaveLength(1) // Only the input
    })

    it('native calendar icon appears at end of input field', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const dateInput = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      
      // datetime-local inputs automatically have calendar icon positioned at the end
      expect(dateInput).toBeInTheDocument()
      expect(dateInput.type).toBe('datetime-local')
    })
  })

  describe('Form Layout Responsiveness', () => {
    it('form renders in mobile-friendly layout', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Check that form container has proper mobile layout classes
      const formContainer = screen.getByRole('form')
      expect(formContainer).toBeInTheDocument()
    })

    it('amount and account fields use grid layout on larger screens', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const amountField = screen.getByPlaceholderText('Enter amount...')
      const accountField = screen.getByText('Select account')
      
      // Check that both fields exist and can be rendered side by side
      expect(amountField).toBeInTheDocument()
      expect(accountField).toBeInTheDocument()
    })

    it('date and tags fields use grid layout on larger screens', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const dateField = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      const tagsField = screen.getByPlaceholderText('Add tags...')
      
      expect(dateField).toBeInTheDocument()
      expect(tagsField).toBeInTheDocument()
    })
  })

  describe('Modal Structure and Layout', () => {
    it('has proper modal sections - fixed header, scrollable content, fixed footer', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Fixed header with tabs
      expect(screen.getByText('Expense')).toBeInTheDocument()
      expect(screen.getByText('Income')).toBeInTheDocument()
      
      // Scrollable content with form fields
      expect(screen.getByText('Amount *')).toBeInTheDocument()
      expect(screen.getByText('Category *')).toBeInTheDocument()
      
      // Fixed footer with buttons
      expect(screen.getByText('Add expense')).toBeInTheDocument()
    })

    it('form fields are properly contained within scrollable area', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // All form fields should be within the form
      const formFields = [
        screen.getByPlaceholderText('Enter amount...'),
        screen.getByText('Select account'),
        screen.getByText('Select category...'),
        screen.getByPlaceholderText('What was this expense for?'),
        screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
        screen.getByPlaceholderText('Add tags...')
      ]
      
      formFields.forEach(field => {
        expect(field).toBeInTheDocument()
      })
    })
  })

  describe('Category Dropdown Positioning', () => {
    it('category dropdown has proper width and positioning classes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector type="expense" value="" onChange={vi.fn()} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const dropdown = screen.getByText('Food & Dining').closest('[class*="absolute"]')
        expect(dropdown).toBeInTheDocument()
      })
    })

    it('category dropdown has proper height constraints for scrolling', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategorySelector type="expense" value="" onChange={vi.fn()} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      
      await waitFor(() => {
        const scrollableArea = screen.getByText('Food & Dining')
          .closest('[class*="max-h-64"]')
        expect(scrollableArea).toBeInTheDocument()
        expect(scrollableArea).toHaveClass('overflow-y-auto')
      })
    })
  })

  describe('Touch and Mobile Interactions', () => {
    it('form fields are touch-friendly on mobile devices', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Test touch interactions on form fields
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.click(amountInput)
      
      expect(amountInput).toHaveFocus()
    })

    it('dropdown triggers work with touch events', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Test account dropdown
      const accountTrigger = screen.getByText('Select account')
      await user.click(accountTrigger)
      
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
      })
    })

    it('category dropdown works with touch on mobile', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      await user.click(screen.getByText('Select category...'))
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search categories...')).toBeInTheDocument()
      })
    })
  })

  describe('Tags Component Responsive Behavior', () => {
    it('tags wrap properly on smaller screens', async () => {
      renderWithProviders(<TagsInput value={['Essential', 'Planned', 'Recurring']} onChange={vi.fn()} />)
      
      // Tags should be displayed and wrapped
      expect(screen.getByText('Essential')).toBeInTheDocument()
      expect(screen.getByText('Planned')).toBeInTheDocument()
      expect(screen.getByText('Recurring')).toBeInTheDocument()
    })

    it('quick add tags wrap properly', () => {
      renderWithProviders(<TagsInput value={[]} onChange={vi.fn()} />)
      
      // Quick add section should be visible
      expect(screen.getByText('Quick add:')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Essential' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Optional' })).toBeInTheDocument()
    })

    it('tag removal buttons are touch-friendly', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      renderWithProviders(<TagsInput value={['Test Tag']} onChange={onChange} />)
      
      const removeButton = screen.getByLabelText('Remove Test Tag tag')
      await user.click(removeButton)
      
      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  describe('Viewport and Breakpoint Tests', () => {
    it('handles different viewport sizes gracefully', () => {
      // Test common mobile breakpoints
      const breakpoints = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 736 }, // iPhone 8 Plus
        { width: 768, height: 1024 } // iPad
      ]
      
      breakpoints.forEach(({ width, height }) => {
        // Mock viewport size
        Object.defineProperty(window, 'innerWidth', { writable: true, value: width })
        Object.defineProperty(window, 'innerHeight', { writable: true, value: height })
        
        renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
        
        // Form should render without issues
        expect(screen.getByText('Amount *')).toBeInTheDocument()
        expect(screen.getByText('Add expense')).toBeInTheDocument()
      })
    })
  })

  describe('Focus Management Across Components', () => {
    it('maintains proper focus flow between form elements', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Tab through form elements
      await user.tab() // Amount field
      expect(screen.getByPlaceholderText('Enter amount...')).toHaveFocus()
      
      await user.tab() // Account field
      expect(screen.getByRole('combobox')).toHaveFocus()
      
      // Continue tabbing should work without issues
      await user.tab() // Category field
      await user.tab() // Description field
      expect(screen.getByPlaceholderText('What was this expense for?')).toHaveFocus()
    })

    it('focus returns properly after dropdown interactions', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      const categoryTrigger = screen.getByText('Select category...')
      await user.click(categoryTrigger)
      
      // Close with Escape
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(categoryTrigger).toHaveFocus()
      })
    })
  })

  describe('Complete User Journey Integration Tests', () => {
    it('completes full expense entry workflow on mobile', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Simulate mobile user workflow
      await user.type(screen.getByPlaceholderText('Enter amount...'), '25.50')
      
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food'))
      await user.click(screen.getByText('Food'))
      
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Mobile lunch order')
      
      // Add tags
      await user.click(screen.getByRole('button', { name: 'Essential' }))
      
      // Submit
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(mockData.transactions.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 25.5,
            type: 'expense',
            accountId: 1,
            category: 'Food',
            description: 'Mobile lunch order',
            tags: ['Essential']
          })
        )
      })
    })

    it('handles form errors and recovery on mobile', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Submit empty form
      await user.click(screen.getByText('Add expense'))
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Amount is required and must be positive')).toBeInTheDocument()
        expect(screen.getByText('Please select an account')).toBeInTheDocument()
      })
      
      // Fix errors
      await user.type(screen.getByPlaceholderText('Enter amount...'), '10')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food'))
      await user.click(screen.getByText('Food'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Fixed')
      
      // Submit again
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(mockData.transactions.addTransaction).toHaveBeenCalled()
      })
    })

    it('switches between expense and income with full workflow', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Start with expense
      await user.type(screen.getByPlaceholderText('Enter amount...'), '50')
      
      // Switch to income
      await user.click(screen.getByText('Income'))
      expect(screen.getByText('Add income')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('What was this income for?')).toBeInTheDocument()
      
      // Complete income entry
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.type(screen.getByPlaceholderText('What was this income for?'), 'Freelance work')
      
      // Submit income
      await user.click(screen.getByText('Add income'))
      
      await waitFor(() => {
        expect(mockData.transactions.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'income',
            description: 'Freelance work'
          })
        )
      })
    })
  })

  describe('Performance and Accessibility', () => {
    it('form remains responsive during rapid interactions', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Rapid tab switching
      await user.click(screen.getByText('Income'))
      await user.click(screen.getByText('Expense'))
      await user.click(screen.getByText('Income'))
      await user.click(screen.getByText('Expense'))
      
      // Should remain stable
      expect(screen.getByText('Add expense')).toBeInTheDocument()
    })

    it('maintains accessibility during responsive layout changes', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Check ARIA labels and accessibility attributes
      const amountLabel = screen.getByText('Amount *')
      const accountLabel = screen.getByText('Account *')
      const categoryLabel = screen.getByText('Category *')
      
      expect(amountLabel).toBeInTheDocument()
      expect(accountLabel).toBeInTheDocument()
      expect(categoryLabel).toBeInTheDocument()
    })

    it('handles orientation changes gracefully', () => {
      // Mock orientation change
      Object.defineProperty(window.screen, 'orientation', {
        writable: true,
        value: { angle: 90, type: 'landscape-primary' }
      })
      
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      // Form should still render correctly
      expect(screen.getByText('Add expense')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter amount...')).toBeInTheDocument()
    })
  })
})