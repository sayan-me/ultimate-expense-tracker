import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddExpenseForm } from '../add-expense-form'
import { renderWithProviders } from '@/tests/test-utils'

// Mock the useDB hook with comprehensive test data
const mockAccounts = {
  accounts: [
    {
      id: 1,
      name: 'Cash',
      type: 'cash',
      balance: 500.00,
      isDefault: true,
      createdAt: new Date()
    }
  ],
  addAccount: vi.fn(),
  deleteAccount: vi.fn(),
  updateAccount: vi.fn(),
  useDefaultAccount: vi.fn()
}

const mockTransactions = {
  transactions: [],
  addTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  updateTransaction: vi.fn()
}

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
      name: 'Salary',
      icon: 'briefcase',
      color: '#059669',
      isDefault: true,
      type: 'income',
      createdAt: new Date()
    }
  ],
  addCategory: vi.fn()
}

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    accounts: mockAccounts,
    transactions: mockTransactions,
    categories: mockCategories
  })
}))

describe('AddExpenseForm - Original UX Issues', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Amount Field Issues (Original Bug)', () => {
    it('starts with empty amount field, not pre-filled with 0', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      expect(amountInput).toHaveValue('')
      expect(amountInput).not.toHaveValue('0')
    })

    it('has proper placeholder text in amount field', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Enter amount...')).toBeInTheDocument()
    })

    it('cursor positioning works correctly in amount field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.click(amountInput)
      
      // Cursor should be at the beginning of empty field
      expect(amountInput).toHaveFocus()
      expect(amountInput.selectionStart).toBe(0)
    })

    it('backspace works properly in amount field when empty', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.click(amountInput)
      await user.keyboard('{Backspace}')
      
      // Should not cause any issues when field is empty
      expect(amountInput).toHaveValue('')
    })

    it('accepts numeric input correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.type(amountInput, '125.50')
      
      expect(amountInput).toHaveValue('125.5') // React number input behavior
    })

    it('handles decimal input correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.type(amountInput, '99.99')
      
      expect(amountInput).toHaveValue('99.99')
    })
  })

  describe('Description Field Issues (Original Bug)', () => {
    it('has placeholder-only approach, no pre-filled text to delete', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const descriptionInput = screen.getByPlaceholderText('What was this expense for?')
      expect(descriptionInput).toHaveValue('')
    })

    it('placeholder text changes based on expense/income type', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Default is expense
      expect(screen.getByPlaceholderText('What was this expense for?')).toBeInTheDocument()
      
      // Switch to income
      await user.click(screen.getByText('Income'))
      expect(screen.getByPlaceholderText('What was this income for?')).toBeInTheDocument()
    })

    it('accepts text input without requiring deletion of pre-filled content', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const descriptionInput = screen.getByPlaceholderText('What was this expense for?')
      await user.type(descriptionInput, 'Lunch at restaurant')
      
      expect(descriptionInput).toHaveValue('Lunch at restaurant')
    })
  })

  describe('Date Field Issues (Original Bug)', () => {
    it('shows only one calendar icon, not duplicates', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const dateInput = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      
      // The datetime-local input should have its native calendar icon
      // We should not see any duplicate icons
      expect(dateInput).toBeInTheDocument()
      expect(dateInput.type).toBe('datetime-local')
    })

    it('allows current day entries (fixes "Date cannot be in the future" issue)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill in all required fields with today's date
      await user.type(screen.getByPlaceholderText('Enter amount...'), '50')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      // Category selection
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test expense')
      
      // Try to submit - should not get date validation error
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.queryByText('Date cannot be in the future')).not.toBeInTheDocument()
      })
    })

    it('date field has proper datetime-local input type', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const dateInput = screen.getByDisplayValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
      expect(dateInput.type).toBe('datetime-local')
    })
  })

  describe('Form Validation Timing (Original Bug)', () => {
    it('does not trigger validation on field changes, only on submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Change fields without submitting
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      
      // Should not see validation errors yet
      expect(screen.queryByText('Amount is required and must be positive')).not.toBeInTheDocument()
      expect(screen.queryByText('Please select an account')).not.toBeInTheDocument()
      expect(screen.queryByText('Description is required')).not.toBeInTheDocument()
    })

    it('shows validation errors only after submit attempt', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Try to submit empty form
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.getByText('Amount is required and must be positive')).toBeInTheDocument()
        expect(screen.getByText('Please select an account')).toBeInTheDocument()
        expect(screen.getByText('Category is required')).toBeInTheDocument()
        expect(screen.getByText('Description is required')).toBeInTheDocument()
      })
    })

    it('category selection does not trigger premature form validation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Select category
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      
      // Should not see validation errors for other fields
      expect(screen.queryByText('Amount is required and must be positive')).not.toBeInTheDocument()
      expect(screen.queryByText('Description is required')).not.toBeInTheDocument()
    })
  })

  describe('Form Field Placeholders (No Pre-filled Content)', () => {
    it('no field has pre-filled content that users must delete', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Amount field
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      expect(amountInput).toHaveValue('')
      
      // Description field
      const descriptionInput = screen.getByPlaceholderText('What was this expense for?')
      expect(descriptionInput).toHaveValue('')
      
      // Account and Category use Select components with placeholders
      expect(screen.getByText('Select account')).toBeInTheDocument()
      expect(screen.getByText('Select category...')).toBeInTheDocument()
    })

    it('all fields show helpful placeholder guidance', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Enter amount...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('What was this expense for?')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument()
      expect(screen.getByText('Select account')).toBeInTheDocument()
      expect(screen.getByText('Select category...')).toBeInTheDocument()
    })
  })
})

describe('AddExpenseForm - Complete Form Functionality', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('renders all required form fields', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Amount *')).toBeInTheDocument()
      expect(screen.getByText('Account *')).toBeInTheDocument()
      expect(screen.getByText('Category *')).toBeInTheDocument()
      expect(screen.getByText('Description *')).toBeInTheDocument()
      expect(screen.getByText('Date *')).toBeInTheDocument()
    })

    it('renders expense/income tabs', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Expense')).toBeInTheDocument()
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    it('defaults to expense type', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const expenseTab = screen.getByText('Expense')
      expect(expenseTab).toHaveAttribute('data-state', 'active')
    })

    it('renders optional tags field', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Tags (Optional)')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Add expense')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Tab Switching', () => {
    it('switches between expense and income tabs', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Click income tab
      await user.click(screen.getByText('Income'))
      
      expect(screen.getByText('Income')).toHaveAttribute('data-state', 'active')
      expect(screen.getByText('Add income')).toBeInTheDocument()
    })

    it('updates button text when switching tabs', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Add expense')).toBeInTheDocument()
      
      await user.click(screen.getByText('Income'))
      expect(screen.getByText('Add income')).toBeInTheDocument()
    })

    it('updates description placeholder when switching tabs', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('What was this expense for?')).toBeInTheDocument()
      
      await user.click(screen.getByText('Income'))
      expect(screen.getByPlaceholderText('What was this income for?')).toBeInTheDocument()
    })

    it('calls onTypeChange callback when provided', async () => {
      const onTypeChange = vi.fn()
      const user = userEvent.setup()
      
      renderWithProviders(<AddExpenseForm {...defaultProps} onTypeChange={onTypeChange} />)
      
      await user.click(screen.getByText('Income'))
      expect(onTypeChange).toHaveBeenCalledWith('income')
    })
  })

  describe('Complete Form Submission', () => {
    it('submits valid expense form successfully', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill all required fields
      await user.type(screen.getByPlaceholderText('Enter amount...'), '50.25')
      
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Lunch expense')
      
      // Submit
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(mockTransactions.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 50.25,
            type: 'expense',
            accountId: 1,
            category: 'Food & Dining',
            description: 'Lunch expense',
            date: expect.any(Date),
            tags: []
          })
        )
      })
    })

    it('updates account balance after submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Enter amount...'), '25')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test')
      
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(mockAccounts.updateAccount).toHaveBeenCalledWith(1, {
          balance: 475.00 // 500.00 - 25.00
        })
      })
    })

    it('calls onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Enter amount...'), '25')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test')
      
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled()
      })
    })

    it('handles income submission correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Switch to income
      await user.click(screen.getByText('Income'))
      
      // Fill form
      await user.type(screen.getByPlaceholderText('Enter amount...'), '1000')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Salary'))
      await user.click(screen.getByText('Salary'))
      await user.type(screen.getByPlaceholderText('What was this income for?'), 'Monthly salary')
      
      await user.click(screen.getByText('Add income'))
      
      await waitFor(() => {
        expect(mockTransactions.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 1000,
            type: 'income'
          })
        )
      })
      
      // Income should increase account balance
      expect(mockAccounts.updateAccount).toHaveBeenCalledWith(1, {
        balance: 1500.00 // 500.00 + 1000.00
      })
    })
  })

  describe('Form Validation', () => {
    it('validates all required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.getByText('Amount is required and must be positive')).toBeInTheDocument()
        expect(screen.getByText('Please select an account')).toBeInTheDocument()
        expect(screen.getByText('Category is required')).toBeInTheDocument()
        expect(screen.getByText('Description is required')).toBeInTheDocument()
      })
    })

    it('validates amount must be positive', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText('Enter amount...'), '0')
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.getByText('Amount is required and must be positive')).toBeInTheDocument()
      })
    })

    it('validates amount maximum limit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.type(screen.getByPlaceholderText('Enter amount...'), '2000000') // Over 1,000,000 limit
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.getByText('Amount cannot exceed 1,000,000')).toBeInTheDocument()
      })
    })

    it('shows loading state during submission', async () => {
      // Mock a delayed response
      mockTransactions.addTransaction.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill form
      await user.type(screen.getByPlaceholderText('Enter amount...'), '25')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test')
      
      await user.click(screen.getByText('Add expense'))
      
      // Should show loading state
      expect(screen.getByText('Adding...')).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Adding...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Reset and Cancel', () => {
    it('resets form after successful submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill and submit form
      const amountInput = screen.getByPlaceholderText('Enter amount...')
      await user.type(amountInput, '25')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      
      const descriptionInput = screen.getByPlaceholderText('What was this expense for?')
      await user.type(descriptionInput, 'Test')
      
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(amountInput).toHaveValue('')
        expect(descriptionInput).toHaveValue('')
        expect(screen.getByText('Select account')).toBeInTheDocument()
        expect(screen.getByText('Select category...')).toBeInTheDocument()
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Cancel'))
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('does not show cancel button when onCancel is not provided', () => {
      renderWithProviders(<AddExpenseForm onSuccess={vi.fn()} />)
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles submission errors gracefully', async () => {
      mockTransactions.addTransaction.mockRejectedValue(new Error('Database error'))
      
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Enter amount...'), '25')
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      await user.click(screen.getByText('Select category...'))
      await waitFor(() => screen.getByText('Food & Dining'))
      await user.click(screen.getByText('Food & Dining'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test')
      
      await user.click(screen.getByText('Add expense'))
      
      // Should not crash and should reset loading state
      await waitFor(() => {
        expect(screen.queryByText('Adding...')).not.toBeInTheDocument()
        expect(screen.getByText('Add expense')).toBeInTheDocument()
      })
    })
  })
})