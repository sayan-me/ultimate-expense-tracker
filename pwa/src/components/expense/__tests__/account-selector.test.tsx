import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddExpenseForm } from '../add-expense-form'
import { renderWithProviders } from '@/tests/test-utils'

// Mock the useDB hook with account data
const mockAccounts = {
  accounts: [
    {
      id: 1,
      name: 'Cash',
      type: 'cash',
      balance: 500.00,
      isDefault: true,
      createdAt: new Date()
    },
    {
      id: 2,
      name: 'Bank Account',
      type: 'bank',
      balance: 2500.50,
      isDefault: false,
      createdAt: new Date()
    },
    {
      id: 3,
      name: 'Credit Card',
      type: 'credit',
      balance: -150.75,
      isDefault: false,
      createdAt: new Date()
    },
    {
      id: 4,
      name: 'Savings',
      type: 'savings',
      balance: 10000.00,
      isDefault: false,
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
      name: 'Food',
      icon: 'utensils',
      color: '#ef4444',
      isDefault: true,
      type: 'expense',
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

describe('Account Selector in Add Expense Form', () => {
  const defaultProps = {
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Account Dropdown Rendering', () => {
    it('renders account selection field with label', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Account *')).toBeInTheDocument()
      expect(screen.getByText('Select account')).toBeInTheDocument()
    })

    it('shows placeholder text when no account is selected', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      expect(screen.getByText('Select account')).toBeInTheDocument()
    })

    it('renders as a required field', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const accountLabel = screen.getByText('Account *')
      expect(accountLabel.textContent).toContain('*')
    })
  })

  describe('Account Dropdown Functionality', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const accountTrigger = screen.getByText('Select account')
      await user.click(accountTrigger)
      
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
      })
    })

    it('displays all available accounts in dropdown', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
        expect(screen.getByText('Bank Account ($2,500.50)')).toBeInTheDocument()
        expect(screen.getByText('Credit Card (-$150.75)')).toBeInTheDocument()
        expect(screen.getByText('Savings ($10,000.00)')).toBeInTheDocument()
      })
    })

    it('shows account names and formatted balances correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        // Check positive balance formatting
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
        expect(screen.getByText('Bank Account ($2,500.50)')).toBeInTheDocument()
        
        // Check negative balance formatting (credit card)
        expect(screen.getByText('Credit Card (-$150.75)')).toBeInTheDocument()
        
        // Check large balance formatting
        expect(screen.getByText('Savings ($10,000.00)')).toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
      })
      
      await user.click(document.body)
      await waitFor(() => {
        expect(screen.queryByText('Cash ($500.00)')).not.toBeInTheDocument()
      })
    })
  })

  describe('Account Selection', () => {
    it('selects account when clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Cash ($500.00)'))
      
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument()
        expect(screen.queryByText('Select account')).not.toBeInTheDocument()
      })
    })

    it('shows selected account in trigger after selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Bank Account ($2,500.50)'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('2')).toBeInTheDocument() // Bank Account has ID 2
      })
    })

    it('closes dropdown after selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      await waitFor(() => {
        expect(screen.queryByText('Bank Account ($2,500.50)')).not.toBeInTheDocument()
      })
    })

    it('allows changing account selection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Select first account
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      // Change to different account
      await user.click(screen.getByDisplayValue('1'))
      await user.click(screen.getByText('Savings ($10,000.00)'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('4')).toBeInTheDocument() // Savings has ID 4
      })
    })
  })

  describe('Account Balance Display', () => {
    it('displays positive balances correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument()
        expect(screen.getByText('Bank Account ($2,500.50)')).toBeInTheDocument()
        expect(screen.getByText('Savings ($10,000.00)')).toBeInTheDocument()
      })
    })

    it('displays negative balances with minus sign', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        expect(screen.getByText('Credit Card (-$150.75)')).toBeInTheDocument()
      })
    })

    it('formats decimal amounts correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        // Check that decimals are properly formatted to 2 places
        expect(screen.getByText('Bank Account ($2,500.50)')).toBeInTheDocument()
        expect(screen.getByText('Cash ($500.00)')).toBeInTheDocument() // .00 should be shown
      })
    })
  })

  describe('Loading and Empty States', () => {
    it('handles loading state when accounts are undefined', () => {
      mockAccounts.accounts = undefined
      
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Should still render the field but with no options
      expect(screen.getByText('Account *')).toBeInTheDocument()
      expect(screen.getByText('Select account')).toBeInTheDocument()
      
      // Restore mock data
      mockAccounts.accounts = [
        {
          id: 1,
          name: 'Cash',
          type: 'cash',
          balance: 500.00,
          isDefault: true,
          createdAt: new Date()
        },
        {
          id: 2,
          name: 'Bank Account',
          type: 'bank',
          balance: 2500.50,
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: 3,
          name: 'Credit Card',
          type: 'credit',
          balance: -150.75,
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: 4,
          name: 'Savings',
          type: 'savings',
          balance: 10000.00,
          isDefault: false,
          createdAt: new Date()
        }
      ]
    })

    it('handles empty accounts array gracefully', async () => {
      mockAccounts.accounts = []
      
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      // Should not crash and should show empty dropdown
      expect(screen.getByText('Select account')).toBeInTheDocument()
      
      // Restore mock data
      mockAccounts.accounts = [
        {
          id: 1,
          name: 'Cash',
          type: 'cash',
          balance: 500.00,
          isDefault: true,
          createdAt: new Date()
        },
        {
          id: 2,
          name: 'Bank Account',
          type: 'bank',
          balance: 2500.50,
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: 3,
          name: 'Credit Card',
          type: 'credit',
          balance: -150.75,
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: 4,
          name: 'Savings',
          type: 'savings',
          balance: 10000.00,
          isDefault: false,
          createdAt: new Date()
        }
      ]
    })
  })

  describe('Form Integration', () => {
    it('shows validation error when no account selected on submit', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Try to submit without selecting account
      const submitButton = screen.getByText('Add expense')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please select an account')).toBeInTheDocument()
      })
    })

    it('does not show validation error when account is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Select an account
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Cash ($500.00)'))
      
      // Fill other required fields
      await user.type(screen.getByPlaceholderText('Enter amount...'), '50')
      await user.click(screen.getByText('Category *'))
      await waitFor(() => screen.getByText('Food'))
      await user.click(screen.getByText('Food'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test expense')
      
      // Submit form
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(screen.queryByText('Please select an account')).not.toBeInTheDocument()
      })
    })

    it('includes account ID in form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      // Fill form with account selection
      await user.click(screen.getByText('Select account'))
      await user.click(screen.getByText('Bank Account ($2,500.50)'))
      await user.type(screen.getByPlaceholderText('Enter amount...'), '50')
      await user.click(screen.getByText('Category *'))
      await waitFor(() => screen.getByText('Food'))
      await user.click(screen.getByText('Food'))
      await user.type(screen.getByPlaceholderText('What was this expense for?'), 'Test expense')
      
      await user.click(screen.getByText('Add expense'))
      
      await waitFor(() => {
        expect(mockTransactions.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            accountId: 2 // Bank Account ID
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label association', () => {
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const accountLabel = screen.getByText('Account *')
      expect(accountLabel).toBeInTheDocument()
    })

    it('dropdown trigger is focusable', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const accountTrigger = screen.getByRole('combobox')
      await user.tab()
      await user.tab() // Tab past amount field to account field
      
      expect(document.activeElement).toBe(accountTrigger)
    })

    it('keyboard navigation works in dropdown', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      const accountTrigger = screen.getByRole('combobox')
      await user.click(accountTrigger)
      
      // Test arrow key navigation
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        // Should select first account
        expect(screen.getByDisplayValue('1')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles accounts with very long names', async () => {
      const longNameAccount = {
        id: 5,
        name: 'This Is A Very Long Account Name That Should Be Handled Properly Without Breaking Layout',
        type: 'bank',
        balance: 1000.00,
        isDefault: false,
        createdAt: new Date()
      }
      
      mockAccounts.accounts.push(longNameAccount)
      
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        expect(screen.getByText(`${longNameAccount.name} ($1,000.00)`)).toBeInTheDocument()
      })
      
      // Cleanup
      mockAccounts.accounts.pop()
    })

    it('handles accounts with zero balance', async () => {
      const zeroBalanceAccount = {
        id: 6,
        name: 'Empty Account',
        type: 'bank',
        balance: 0.00,
        isDefault: false,
        createdAt: new Date()
      }
      
      mockAccounts.accounts.push(zeroBalanceAccount)
      
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        expect(screen.getByText('Empty Account ($0.00)')).toBeInTheDocument()
      })
      
      // Cleanup
      mockAccounts.accounts.pop()
    })

    it('handles large balance numbers correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AddExpenseForm {...defaultProps} />)
      
      await user.click(screen.getByText('Select account'))
      
      await waitFor(() => {
        // Check that large numbers are formatted with commas
        expect(screen.getByText('Savings ($10,000.00)')).toBeInTheDocument()
      })
    })
  })
})