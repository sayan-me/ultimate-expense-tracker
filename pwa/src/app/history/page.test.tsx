import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format } from 'date-fns'
import HistoryPage from './page'
import type { Transaction } from '@/lib/db'

let mockTransactions: Transaction[] | undefined
const mockDeleteTransfer = vi.fn()

vi.mock('@/contexts/db-context', () => ({
  useDB: () => ({
    transactions: { transactions: mockTransactions, deleteTransfer: mockDeleteTransfer },
  }),
}))

vi.mock('@/components/expense/add-expense-modal', () => ({
  AddExpenseModal: () => null,
}))

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A date `n` days before "now", anchored to noon local time so the day-math
 * doesn't wobble across midnight/DST. Used throughout instead of hardcoded
 * calendar dates — the page now has a default "Last 30 days" filter, so any
 * fixture dated with a fixed past calendar date (e.g. a literal 2026-11-05)
 * would silently fall out of range, and therefore out of these tests,
 * whenever the suite is actually run more than 30 days after that date.
 */
function daysAgo(n: number): Date {
  const anchor = new Date()
  anchor.setHours(12, 0, 0, 0)
  return new Date(anchor.getTime() - n * DAY_MS)
}

function dateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  const defaultDate = daysAgo(2)
  return {
    id: 1,
    amount: 1000,
    type: 'expense',
    category: 'Food',
    description: 'Lunch',
    date: defaultDate,
    accountId: 1,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  }
}

const selectUser = () => userEvent.setup({ pointerEventsCheck: 0 })

async function chooseOption(user: ReturnType<typeof selectUser>, comboboxName: string, optionName: string) {
  await user.click(screen.getByRole('combobox', { name: comboboxName }))
  await user.click(screen.getByRole('option', { name: optionName }))
}

/**
 * Asserts `earlier` appears before `later` in document order. Deliberately
 * not `container.innerHTML.indexOf(...)`: the Sort By control's own label
 * text (e.g. "Newest First", "Oldest First") contains the same words as
 * some of these fixtures' descriptions, which made plain substring search
 * unreliable.
 */
function expectDomOrder(earlier: HTMLElement, later: HTMLElement) {
  expect(earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
}

describe('HistoryPage', () => {
  beforeEach(() => {
    mockDeleteTransfer.mockReset()
    mockDeleteTransfer.mockResolvedValue(undefined)
  })

  it('renders the page title', () => {
    mockTransactions = [tx()]
    render(<HistoryPage />)
    expect(screen.getByRole('heading', { name: 'Transaction History' })).toBeInTheDocument()
  })

  describe('month grouping and default expansion', () => {
    it('groups transactions by month, with the most recent month expanded by default', () => {
      const date = daysAgo(2)
      mockTransactions = [tx({ description: 'Lunch', date, createdAt: date, updatedAt: date })]
      render(<HistoryPage />)

      expect(screen.getByText(format(date, 'MMMM yyyy'))).toBeInTheDocument()
      // No click needed — the only (and therefore most recent) month starts expanded.
      expect(screen.getByText('Lunch')).toBeInTheDocument()
    })

    it('collapses and re-expands a month when its header is clicked', async () => {
      const user = selectUser()
      const date = daysAgo(2)
      mockTransactions = [tx({ description: 'Lunch', date, createdAt: date, updatedAt: date })]
      render(<HistoryPage />)

      const header = screen.getByText(format(date, 'MMMM yyyy'))
      expect(screen.getByText('Lunch')).toBeInTheDocument()

      await user.click(header)
      expect(screen.queryByText('Lunch')).not.toBeInTheDocument()

      await user.click(header)
      expect(screen.getByText('Lunch')).toBeInTheDocument()
    })

    it('keeps an older month collapsed by default while the most recent month stays expanded, and both can be open at once', async () => {
      const user = selectUser()
      const recentDate = daysAgo(2)
      const olderDate = daysAgo(65) // >30 days (default range) but within 90
      mockTransactions = [
        tx({ id: 1, description: 'Lunch', date: recentDate, createdAt: recentDate, updatedAt: recentDate }),
        tx({ id: 2, description: 'Groceries', category: 'Food', date: olderDate, createdAt: olderDate, updatedAt: olderDate }),
      ]
      render(<HistoryPage />)

      // Widen the date range so the older month's transaction isn't excluded entirely.
      await chooseOption(user, 'Date Range', 'Last 90 days')

      const recentHeader = screen.getByText(format(recentDate, 'MMMM yyyy'))
      const olderHeader = screen.getByText(format(olderDate, 'MMMM yyyy'))
      expect(recentHeader).toBeInTheDocument()
      expect(olderHeader).toBeInTheDocument()

      // Most recent month: expanded by default.
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      // Older month: collapsed by default.
      expect(screen.queryByText('Groceries')).not.toBeInTheDocument()

      await user.click(olderHeader)

      // Both are now expanded simultaneously.
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()
    })
  })

  describe('per-transaction rendering (within the default-expanded month)', () => {
    it('shows an expense in red with a minus sign', () => {
      mockTransactions = [tx({ type: 'expense', amount: 1000 })]
      render(<HistoryPage />)
      expect(screen.getByText('-$10.00')).toBeInTheDocument()
    })

    it('shows income in green with a plus sign', () => {
      mockTransactions = [tx({ type: 'income', amount: 1000 })]
      render(<HistoryPage />)
      expect(screen.getByText('+$10.00')).toBeInTheDocument()
    })

    it('shows a transfer_out with a minus sign and transfer_in with a plus sign', () => {
      mockTransactions = [
        tx({ id: 1, type: 'transfer_out', amount: 2000, category: 'Transfer', description: 'To savings', transferId: 't1' }),
        tx({ id: 2, type: 'transfer_in', amount: 2000, category: 'Transfer', description: 'To savings', transferId: 't1' }),
      ]
      render(<HistoryPage />)
      expect(screen.getByText('-$20.00')).toBeInTheDocument()
      expect(screen.getByText('+$20.00')).toBeInTheDocument()
    })

    it('does not make a transfer row clickable/editable', () => {
      mockTransactions = [tx({ type: 'transfer_out', category: 'Transfer', description: 'To savings' })]
      render(<HistoryPage />)
      // An editable row is a <button>; a transfer row must not be one.
      expect(screen.queryByRole('button', { name: /to savings/i })).not.toBeInTheDocument()
      expect(screen.getByText('To savings')).toBeInTheDocument()
    })

    // B1 in the real-user test report: transfers couldn't be deleted at all.
    it('deletes a transfer (both legs) after confirming, via its delete button', async () => {
      const user = selectUser()
      mockTransactions = [tx({ type: 'transfer_out', category: 'Transfer', description: 'To savings', transferId: 't1' })]
      render(<HistoryPage />)

      await user.click(screen.getByRole('button', { name: /delete transfer/i }))
      await user.click(screen.getByRole('button', { name: /^delete$/i }))

      expect(mockDeleteTransfer).toHaveBeenCalledWith('t1')
    })
  })

  describe('search', () => {
    it('filters by search query across description and category', async () => {
      const user = selectUser()
      mockTransactions = [tx({ id: 1, description: 'Lunch', category: 'Food' }), tx({ id: 2, description: 'Taxi', category: 'Transport' })]
      render(<HistoryPage />)
      await user.type(screen.getByPlaceholderText('Search transactions...'), 'taxi')
      expect(screen.getByText('Taxi')).toBeInTheDocument()
      expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
    })
  })

  describe('empty states', () => {
    it('shows an empty state when there are no transactions', () => {
      mockTransactions = []
      render(<HistoryPage />)
      expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
    })

    it('shows a "no matches" message when filters exclude every transaction', async () => {
      const user = selectUser()
      mockTransactions = [tx({ description: 'Lunch' })]
      render(<HistoryPage />)
      await user.type(screen.getByPlaceholderText('Search transactions...'), 'zzz-no-match')
      expect(screen.getByText('No transactions match your filters.')).toBeInTheDocument()
    })
  })

  describe('group by category', () => {
    it('groups by category, alphabetically, when Group By is set to Category', async () => {
      const user = selectUser()
      mockTransactions = [
        tx({ id: 1, description: 'Lunch', category: 'Food' }),
        tx({ id: 2, description: 'Taxi', category: 'Transport' }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Group By', 'Category')

      // Group headers render as <h3> (CardTitle) — queried by role to avoid
      // colliding with the per-row category text (e.g. Lunch's own "Food").
      expect(screen.getByRole('heading', { name: 'Food' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Transport' })).toBeInTheDocument()
      // Alphabetically-first category ("Food") is expanded by default.
      expect(screen.getByText('Lunch')).toBeInTheDocument()
      expect(screen.queryByText('Taxi')).not.toBeInTheDocument()

      await user.click(screen.getByText('Transport'))
      expect(screen.getByText('Taxi')).toBeInTheDocument()
    })

    it('puts transactions with no category into their own "Uncategorized" section, sorted last', async () => {
      const user = selectUser()
      mockTransactions = [
        tx({ id: 1, description: 'Lunch', category: 'Food' }),
        tx({ id: 2, description: 'Mystery charge', category: '' }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Group By', 'Category')

      expect(screen.getByRole('heading', { name: 'Food' })).toBeInTheDocument()
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()
      expect(screen.queryByText('Mystery charge')).not.toBeInTheDocument()

      await user.click(screen.getByText('Uncategorized'))
      expect(screen.getByText('Mystery charge')).toBeInTheDocument()
    })
  })

  describe('sort by', () => {
    // Same calendar day (different times) so both rows always land in the
    // same month group — the ordering under test is otherwise at the mercy
    // of whether "today" happens to be near a month boundary.
    const sameDayEarlier = daysAgo(2)
    sameDayEarlier.setHours(9, 0, 0, 0)
    const sameDayLater = daysAgo(2)
    sameDayLater.setHours(15, 0, 0, 0)

    it('sorts Newest First by default', () => {
      mockTransactions = [
        tx({ id: 1, description: 'First', date: sameDayEarlier, createdAt: sameDayEarlier, updatedAt: sameDayEarlier }),
        tx({ id: 2, description: 'Second', date: sameDayLater, createdAt: sameDayLater, updatedAt: sameDayLater }),
      ]
      render(<HistoryPage />)
      expectDomOrder(screen.getByText('Second'), screen.getByText('First'))
    })

    it('sorts Oldest First when selected', async () => {
      const user = selectUser()
      mockTransactions = [
        tx({ id: 1, description: 'First', date: sameDayEarlier, createdAt: sameDayEarlier, updatedAt: sameDayEarlier }),
        tx({ id: 2, description: 'Second', date: sameDayLater, createdAt: sameDayLater, updatedAt: sameDayLater }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Sort By', 'Oldest First')

      expectDomOrder(screen.getByText('First'), screen.getByText('Second'))
    })

    it('sorts by Amount: High to Low when selected', async () => {
      const user = selectUser()
      mockTransactions = [
        tx({ id: 1, description: 'Cheap', amount: 500 }),
        tx({ id: 2, description: 'Pricey', amount: 5000 }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Sort By', 'Amount: High to Low')

      expectDomOrder(screen.getByText('Pricey'), screen.getByText('Cheap'))
    })

    it('sorts by Amount: Low to High when selected', async () => {
      const user = selectUser()
      mockTransactions = [
        tx({ id: 1, description: 'Cheap', amount: 500 }),
        tx({ id: 2, description: 'Pricey', amount: 5000 }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Sort By', 'Amount: Low to High')

      expectDomOrder(screen.getByText('Cheap'), screen.getByText('Pricey'))
    })
  })

  describe('date range filter', () => {
    it('defaults to "Last 30 days" and excludes older transactions', () => {
      const within = daysAgo(5)
      const outside = daysAgo(50)
      mockTransactions = [
        tx({ id: 1, description: 'WithinThirty', date: within, createdAt: within, updatedAt: within }),
        tx({ id: 2, description: 'OutsideThirty', date: outside, createdAt: outside, updatedAt: outside }),
      ]
      render(<HistoryPage />)

      expect(screen.getByText('WithinThirty')).toBeInTheDocument()
      expect(screen.queryByText('OutsideThirty')).not.toBeInTheDocument()
    })

    it('shows transactions up to 90 days back when "Last 90 days" is selected', async () => {
      const user = selectUser()
      const within = daysAgo(50)
      const outside = daysAgo(120)
      mockTransactions = [
        tx({ id: 1, description: 'WithinNinety', date: within, createdAt: within, updatedAt: within }),
        tx({ id: 2, description: 'OutsideNinety', date: outside, createdAt: outside, updatedAt: outside }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Date Range', 'Last 90 days')

      expect(screen.getByText('WithinNinety')).toBeInTheDocument()
      expect(screen.queryByText('OutsideNinety')).not.toBeInTheDocument()
    })

    it('shows transactions up to 180 days back when "Last 180 days" is selected', async () => {
      const user = selectUser()
      const within = daysAgo(120)
      const outside = daysAgo(200)
      mockTransactions = [
        tx({ id: 1, description: 'WithinOneEighty', date: within, createdAt: within, updatedAt: within }),
        tx({ id: 2, description: 'OutsideOneEighty', date: outside, createdAt: outside, updatedAt: outside }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Date Range', 'Last 180 days')

      expect(screen.getByText('WithinOneEighty')).toBeInTheDocument()
      expect(screen.queryByText('OutsideOneEighty')).not.toBeInTheDocument()
    })

    it('filters to an explicit start/end range when "Custom" is selected', async () => {
      const user = selectUser()
      const inRange = daysAgo(10)
      const outOfRange = daysAgo(40)
      mockTransactions = [
        tx({ id: 1, description: 'InCustomRange', date: inRange, createdAt: inRange, updatedAt: inRange }),
        tx({ id: 2, description: 'OutsideCustomRange', date: outOfRange, createdAt: outOfRange, updatedAt: outOfRange }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Date Range', 'Custom')

      fireEvent.change(screen.getByLabelText('Start date'), { target: { value: dateInputValue(daysAgo(15)) } })
      fireEvent.change(screen.getByLabelText('End date'), { target: { value: dateInputValue(daysAgo(0)) } })

      expect(screen.getByText('InCustomRange')).toBeInTheDocument()
      expect(screen.queryByText('OutsideCustomRange')).not.toBeInTheDocument()
    })
  })

  describe('composing all five controls together', () => {
    it('narrows and reorders correctly when Date Range, Group By, Sort By, Transaction Type and Search are all applied at once', async () => {
      const user = selectUser()
      const d = (n: number) => daysAgo(n)
      mockTransactions = [
        // Kept: expense, within 90 days, matches search "trip"
        tx({ id: 1, type: 'expense', category: 'Food', description: 'Lunch trip', amount: 5000, date: d(2), createdAt: d(2), updatedAt: d(2) }),
        tx({ id: 2, type: 'expense', category: '', description: 'Snack trip', amount: 200, date: d(3), createdAt: d(3), updatedAt: d(3) }),
        tx({ id: 3, type: 'expense', category: 'Transport', description: 'Taxi trip', amount: 1500, date: d(4), createdAt: d(4), updatedAt: d(4) }),
        tx({ id: 4, type: 'expense', category: 'Transport', description: 'Bus trip', amount: 300, date: d(5), createdAt: d(5), updatedAt: d(5) }),
        // Excluded: wrong type (income)
        tx({ id: 5, type: 'income', category: 'Salary', description: 'Paycheck trip', amount: 200000, date: d(2), createdAt: d(2), updatedAt: d(2) }),
        // Excluded: outside the 90-day window
        tx({ id: 6, type: 'expense', category: 'Food', description: 'Old trip', amount: 100, date: d(150), createdAt: d(150), updatedAt: d(150) }),
        // Excluded: doesn't match the search term
        tx({ id: 7, type: 'expense', category: 'Transport', description: 'Skip rope', amount: 50, date: d(2), createdAt: d(2), updatedAt: d(2) }),
      ]
      render(<HistoryPage />)

      await chooseOption(user, 'Transaction Type', 'Expense')
      await chooseOption(user, 'Date Range', 'Last 90 days')
      await chooseOption(user, 'Group By', 'Category')
      await chooseOption(user, 'Sort By', 'Amount: High to Low')
      await user.type(screen.getByPlaceholderText('Search transactions...'), 'trip')

      // Groups present, alphabetical with Uncategorized last. "Food" is
      // queried by heading role since it's expanded by default and so also
      // appears as "Lunch trip"'s own category text.
      expect(screen.getByRole('heading', { name: 'Food' })).toBeInTheDocument()
      expect(screen.getByText('Transport')).toBeInTheDocument()
      expect(screen.getByText('Uncategorized')).toBeInTheDocument()

      // Excluded items never render, regardless of expansion state.
      expect(screen.queryByText('Paycheck trip')).not.toBeInTheDocument()
      expect(screen.queryByText('Old trip')).not.toBeInTheDocument()
      expect(screen.queryByText('Skip rope')).not.toBeInTheDocument()

      // "Food" is alphabetically first -> expanded by default.
      expect(screen.getByText('Lunch trip')).toBeInTheDocument()
      // "Transport" and "Uncategorized" start collapsed.
      expect(screen.queryByText('Taxi trip')).not.toBeInTheDocument()
      expect(screen.queryByText('Bus trip')).not.toBeInTheDocument()
      expect(screen.queryByText('Snack trip')).not.toBeInTheDocument()

      await user.click(screen.getByText('Transport'))

      // Within "Transport", amount-desc sort puts the 1500 item before the 300 one.
      const taxi = screen.getByText('Taxi trip')
      const bus = screen.getByText('Bus trip')
      expect(taxi.compareDocumentPosition(bus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

      await user.click(screen.getByText('Uncategorized'))
      expect(screen.getByText('Snack trip')).toBeInTheDocument()
    })
  })
})
