import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataManagement } from './data-management'

const mockAccounts = {
  accounts: [
    { id: 1, name: 'Cash', type: 'cash', openingBalance: 100, isDefault: true, createdAt: new Date() },
  ],
}

let mockTransactionsList: unknown[] | undefined
const mockAddTransaction = vi.fn()
const mockTransactions = {
  get transactions() {
    return mockTransactionsList
  },
  addTransaction: mockAddTransaction,
}

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    accounts: mockAccounts,
    transactions: mockTransactions,
  }),
}))

function csvFile(content: string, name = 'import.csv') {
  return new File([content], name, { type: 'text/csv' })
}

const VALID_CSV =
  'date,type,category,description,amount,account,tags\r\n' +
  '2026-01-15T12:00:00.000Z,expense,Food & Dining,Lunch,10.00,Cash,\r\n'

const MIXED_CSV =
  'date,type,category,description,amount,account,tags\r\n' +
  '2026-01-15T12:00:00.000Z,expense,Food & Dining,Good row,10.00,Cash,\r\n' +
  '2026-01-15T12:00:00.000Z,expense,Food & Dining,Bad amount,abc,Cash,\r\n'

describe('DataManagement', () => {
  beforeEach(() => {
    mockTransactionsList = []
    mockAddTransaction.mockReset()
    mockAddTransaction.mockResolvedValue(1)
    // jsdom's URL doesn't implement createObjectURL/revokeObjectURL at
    // all — add them directly rather than replacing the whole global
    // (replacing it broke File's own prototype methods like .text()).
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  describe('Export', () => {
    it('disables the export button when there are no transactions', () => {
      mockTransactionsList = []
      render(<DataManagement />)
      expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()
    })

    it('enables the export button when there are transactions', () => {
      mockTransactionsList = [{ id: 1 }]
      render(<DataManagement />)
      expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled()
    })

    it('triggers a CSV download when clicked', async () => {
      mockTransactionsList = [
        {
          id: 1,
          amount: 1000, // $10.00 in cents
          type: 'expense',
          category: 'Food',
          description: '',
          date: new Date('2026-01-15T12:00:00.000Z'),
          accountId: 1,
          tags: [],
        },
      ]
      const user = userEvent.setup()
      render(<DataManagement />)

      await user.click(screen.getByRole('button', { name: /export csv/i }))

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
      const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob
      expect(blobArg.type).toContain('text/csv')
    })
  })

  describe('Import', () => {
    it('shows a ready-to-import summary after selecting a valid file', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      const input = screen.getByLabelText(/choose csv file/i)
      await user.upload(input, csvFile(VALID_CSV))

      expect(await screen.findByText(/1 row ready to import/i)).toBeInTheDocument()
    })

    it('shows per-row errors alongside valid rows for a mixed file', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      const input = screen.getByLabelText(/choose csv file/i)
      await user.upload(input, csvFile(MIXED_CSV))

      expect(await screen.findByText(/1 row ready to import/i)).toBeInTheDocument()
      expect(screen.getByText(/1 row skipped/i)).toBeInTheDocument()
      expect(screen.getByText(/row 3/i)).toBeInTheDocument()
    })

    it('does not offer an import action for a file with zero valid rows', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      const input = screen.getByLabelText(/choose csv file/i)
      await user.upload(input, csvFile('date,type,category,description,amount,account,tags\r\nbad,bad,,,abc,Nope,\r\n'))

      await waitFor(() => expect(screen.getByText(/0 rows ready to import/i)).toBeInTheDocument())
      expect(screen.queryByRole('button', { name: /^import \d/i })).not.toBeInTheDocument()
    })

    it('writes each valid row via addTransaction when the import is confirmed', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      await user.upload(screen.getByLabelText(/choose csv file/i), csvFile(VALID_CSV))
      await screen.findByText(/1 row ready to import/i)

      await user.click(screen.getByRole('button', { name: /^import 1 transaction/i }))

      await waitFor(() => expect(mockAddTransaction).toHaveBeenCalledTimes(1))
      expect(mockAddTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1000, category: 'Food & Dining', accountId: 1 }) // CSV said $10.00
      )
    })

    it('shows a success message and clears the preview after a successful import', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      await user.upload(screen.getByLabelText(/choose csv file/i), csvFile(VALID_CSV))
      await screen.findByText(/1 row ready to import/i)
      await user.click(screen.getByRole('button', { name: /^import 1 transaction/i }))

      expect(await screen.findByText(/imported 1 transaction/i)).toBeInTheDocument()
      expect(screen.queryByText(/ready to import/i)).not.toBeInTheDocument()
    })

    it('discards the preview without importing when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      await user.upload(screen.getByLabelText(/choose csv file/i), csvFile(VALID_CSV))
      await screen.findByText(/1 row ready to import/i)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockAddTransaction).not.toHaveBeenCalled()
      expect(screen.queryByText(/ready to import/i)).not.toBeInTheDocument()
    })

    it('shows a file-level error for an empty file', async () => {
      const user = userEvent.setup()
      render(<DataManagement />)

      await user.upload(screen.getByLabelText(/choose csv file/i), csvFile(''))

      expect(await screen.findByText(/empty/i)).toBeInTheDocument()
    })
  })
})
