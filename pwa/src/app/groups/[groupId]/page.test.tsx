import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroupDetailPage from './page'
import type { GroupSummary, GroupMember, GroupExpense, GroupBalance } from '@/lib/groups-api'
import { useAuth } from '@/contexts/auth-context'

const mockAddMember = vi.fn()
const mockRemoveMember = vi.fn()
const mockAddExpense = vi.fn()
const mockSettleShare = vi.fn()
const mockGroupRefetch = vi.fn()
const mockExpensesRefetch = vi.fn()
const mockBalancesRefetch = vi.fn()

let mockGroup: GroupSummary | undefined
let mockMembers: GroupMember[]
let mockGroupLoading: boolean
let mockGroupError: string | null

let mockExpenses: GroupExpense[] | undefined
let mockExpensesLoading: boolean
let mockExpensesError: string | null

let mockBalances: GroupBalance[] | undefined
let mockBalancesLoading: boolean
let mockBalancesError: string | null

let mockCurrentUserId: string

vi.mock('next/navigation', () => ({
  useParams: () => ({ groupId: 'g1' }),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/use-groups', () => ({
  useGroup: () => ({
    group: mockGroup,
    members: mockMembers,
    loading: mockGroupLoading,
    error: mockGroupError,
    addMember: mockAddMember,
    removeMember: mockRemoveMember,
    refetch: mockGroupRefetch,
  }),
  useGroupExpenses: () => ({
    expenses: mockExpenses,
    loading: mockExpensesLoading,
    error: mockExpensesError,
    addExpense: mockAddExpense,
    refetch: mockExpensesRefetch,
  }),
  useGroupBalances: () => ({
    balances: mockBalances,
    loading: mockBalancesLoading,
    error: mockBalancesError,
    settleShare: mockSettleShare,
    refetch: mockBalancesRefetch,
  }),
}))

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return { id: 'g1', name: 'Roommates', createdBy: 1, createdAt: '2026-01-01T00:00:00.000Z', memberCount: 2, ...overrides }
}

function member(overrides: Partial<GroupMember> = {}): GroupMember {
  return { userId: 1, name: 'Alice', email: 'alice@example.com', role: 'owner', joinedAt: '2026-01-01T00:00:00.000Z', ...overrides }
}

function expense(overrides: Partial<GroupExpense> = {}): GroupExpense {
  return {
    id: 'e1',
    groupId: 'g1',
    paidBy: 1,
    amount: 2000,
    description: 'Groceries',
    category: null,
    date: '2026-01-05',
    shares: [],
    ...overrides,
  }
}

function balance(overrides: Partial<GroupBalance> = {}): GroupBalance {
  return { userId: 1, name: 'Alice', netBalance: 0, ...overrides }
}

describe('GroupDetailPage', () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 })

  beforeEach(() => {
    mockAddMember.mockReset()
    mockAddMember.mockResolvedValue(undefined)
    mockRemoveMember.mockReset()
    mockRemoveMember.mockResolvedValue(undefined)
    mockAddExpense.mockReset()
    mockAddExpense.mockResolvedValue(undefined)
    mockSettleShare.mockReset()
    mockSettleShare.mockResolvedValue(undefined)
    mockGroupRefetch.mockReset()
    mockExpensesRefetch.mockReset()
    mockBalancesRefetch.mockReset()

    mockGroup = group()
    mockMembers = [member({ userId: 1, role: 'owner' }), member({ userId: 2, name: 'Bob', email: 'bob@example.com', role: 'member' })]
    mockGroupLoading = false
    mockGroupError = null

    mockExpenses = [expense()]
    mockExpensesLoading = false
    mockExpensesError = null

    mockBalances = [balance()]
    mockBalancesLoading = false
    mockBalancesError = null

    mockCurrentUserId = '1'
    mockUseAuth.mockReturnValue({
      user: { id: mockCurrentUserId, email: 'alice@example.com', name: 'Alice', featureLevel: 'registered' },
      firebaseUser: null,
      loading: false,
      error: null,
      isAuthConfigured: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    })
  })

  it('renders the group name as the page title', () => {
    render(<GroupDetailPage />)
    expect(screen.getByRole('heading', { name: 'Roommates', level: 1 })).toBeInTheDocument()
  })

  it('shows "Group" as the title while loading', () => {
    mockGroup = undefined
    mockGroupLoading = true
    render(<GroupDetailPage />)
    expect(screen.getByRole('heading', { name: 'Group', level: 1 })).toBeInTheDocument()
  })

  it('lists members with their name, email, and role', () => {
    render(<GroupDetailPage />)
    const list = within(screen.getByTestId('member-list'))
    expect(list.getByText('Alice')).toBeInTheDocument()
    expect(list.getByText('Bob')).toBeInTheDocument()
    expect(list.getByText(/bob@example\.com/i)).toBeInTheDocument()
    expect(list.getByText('owner')).toBeInTheDocument()
    expect(list.getByText('member')).toBeInTheDocument()
  })

  it('shows the add-member form for the owner', () => {
    render(<GroupDetailPage />)
    expect(screen.getByLabelText(/add member by email/i)).toBeInTheDocument()
  })

  it('does not show the add-member form for a non-owner', () => {
    mockCurrentUserId = '2'
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'bob@example.com', name: 'Bob', featureLevel: 'registered' },
      firebaseUser: null,
      loading: false,
      error: null,
      isAuthConfigured: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    })
    render(<GroupDetailPage />)
    expect(screen.queryByLabelText(/add member by email/i)).not.toBeInTheDocument()
  })

  it('adds a member via the add-member form', async () => {
    const u = user()
    render(<GroupDetailPage />)

    await u.type(screen.getByLabelText(/add member by email/i), 'carol@example.com')
    await u.click(screen.getByRole('button', { name: /add member/i }))

    await waitFor(() => expect(mockAddMember).toHaveBeenCalledWith('carol@example.com'))
  })

  it('shows an inline error when adding a member fails', async () => {
    const u = user()
    mockAddMember.mockRejectedValue(new Error('User not found'))
    render(<GroupDetailPage />)

    await u.type(screen.getByLabelText(/add member by email/i), 'carol@example.com')
    await u.click(screen.getByRole('button', { name: /add member/i }))

    await waitFor(() => expect(screen.getByText(/user not found/i)).toBeInTheDocument())
  })

  it('shows "Leave group" for the current user and removes after confirming', async () => {
    const u = user()
    render(<GroupDetailPage />)

    await u.click(screen.getByRole('button', { name: /leave group/i }))
    expect(mockRemoveMember).not.toHaveBeenCalled()
    await u.click(screen.getByRole('button', { name: /^leave$/i }))

    await waitFor(() => expect(mockRemoveMember).toHaveBeenCalledWith(1))
  })

  it('lets the owner remove another member after confirming', async () => {
    const u = user()
    render(<GroupDetailPage />)

    await u.click(screen.getByRole('button', { name: /remove bob/i }))
    expect(mockRemoveMember).not.toHaveBeenCalled()
    await u.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => expect(mockRemoveMember).toHaveBeenCalledWith(2))
  })

  it('does not show a remove button for other members when not the owner', () => {
    mockMembers = [member({ userId: 1, role: 'member' }), member({ userId: 2, name: 'Bob', email: 'bob@example.com', role: 'owner' })]
    render(<GroupDetailPage />)
    expect(screen.queryByRole('button', { name: /remove bob/i })).not.toBeInTheDocument()
  })

  it('shows an inline error when removing a member fails', async () => {
    const u = user()
    mockRemoveMember.mockRejectedValue(new Error('Cannot remove the last owner'))
    render(<GroupDetailPage />)

    await u.click(screen.getByRole('button', { name: /remove bob/i }))
    await u.click(screen.getByRole('button', { name: /^remove$/i }))

    await waitFor(() => expect(screen.getByText(/cannot remove the last owner/i)).toBeInTheDocument())
  })

  it('shows balances with clear wording for who owes and who is owed', () => {
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: 1500 }), balance({ userId: 2, name: 'Bob', netBalance: -1500 })]
    render(<GroupDetailPage />)
    const list = within(screen.getByTestId('balance-list'))
    expect(list.getByText(/is owed \$15\.00/i)).toBeInTheDocument()
    expect(list.getByText(/owes \$15\.00/i)).toBeInTheDocument()
  })

  it('shows unsettled shares owed by the current user with a settle button', async () => {
    const u = user()
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: -500 })]
    mockExpenses = [
      expense({ id: 'e1', description: 'Dinner', paidBy: 2, shares: [{ userId: 1, shareAmount: 500, isSettled: false }] }),
    ]
    render(<GroupDetailPage />)

    const balanceList = within(screen.getByTestId('balance-list'))
    expect(balanceList.getByText('Dinner')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /mark as settled/i }))

    await waitFor(() => expect(mockSettleShare).toHaveBeenCalledWith('e1', 1))
  })

  // Reported in live UAT (S2): useGroupBalances.settleShare refreshes
  // balances itself, but the "You owe for" sub-list reads isSettled off
  // useGroupExpenses's own (separate) state, which nothing told to
  // refresh — so a just-settled share kept showing as unsettled.
  it('refreshes expenses after settling a share', async () => {
    const u = user()
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: -500 })]
    mockExpenses = [expense({ id: 'e1', description: 'Dinner', paidBy: 2, shares: [{ userId: 1, shareAmount: 500, isSettled: false }] })]
    render(<GroupDetailPage />)

    await u.click(screen.getByRole('button', { name: /mark as settled/i }))

    await waitFor(() => expect(mockExpensesRefetch).toHaveBeenCalled())
  })

  it('does not show unsettled shares when the current user is not owed negatively', () => {
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: 500 })]
    mockExpenses = [expense({ id: 'e1', description: 'Dinner', paidBy: 2, shares: [{ userId: 1, shareAmount: 500, isSettled: false }] })]
    render(<GroupDetailPage />)
    const balanceList = within(screen.getByTestId('balance-list'))
    expect(balanceList.queryByText('Dinner')).not.toBeInTheDocument()
  })

  // Reported in live UAT (S1): "You owe for" listed bills the current
  // user paid themselves, not just what they owe others. Every expense
  // has a share row for every member including the payer (their own
  // portion of the bill), so a filter that only checks
  // `share.userId === currentUserId` wrongly includes the payer's own
  // share of their own expense.
  it('does not list the current user\'s own paid-for expenses in "You owe for"', () => {
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: -500 })]
    mockExpenses = [
      expense({ id: 'e1', description: 'Dinner', paidBy: 2, shares: [{ userId: 1, shareAmount: 500, isSettled: false }] }),
      expense({ id: 'e2', description: 'Groceries', paidBy: 1, shares: [{ userId: 1, shareAmount: 1000, isSettled: false }, { userId: 2, shareAmount: 1000, isSettled: false }] }),
    ]
    render(<GroupDetailPage />)
    const balanceList = within(screen.getByTestId('balance-list'))
    expect(balanceList.getByText('Dinner')).toBeInTheDocument()
    expect(balanceList.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('lists expenses with description, amount, payer, and date', () => {
    mockExpenses = [expense({ description: 'Groceries', amount: 2500, paidBy: 1, date: '2026-01-05' })]
    render(<GroupDetailPage />)
    const list = within(screen.getByTestId('expense-list'))
    expect(list.getByText('Groceries')).toBeInTheDocument()
    expect(list.getByText('$25.00')).toBeInTheDocument()
    expect(list.getByText(/you/i)).toBeInTheDocument()
    expect(list.getByText(/2026-01-05/)).toBeInTheDocument()
  })

  it('adds an expense via the add-expense form, converting dollars to cents', async () => {
    const u = user()
    render(<GroupDetailPage />)

    await u.type(screen.getByLabelText(/description/i), 'Taxi')
    await u.type(screen.getByLabelText(/amount/i), '12.50')
    await u.click(screen.getByRole('button', { name: /^add expense$/i }))

    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Taxi', amount: 1250 })
      )
    )
  })

  // Reported in live UAT (S2): adding an expense updated the Expenses
  // list (useGroupExpenses already refetches itself) but Balances kept
  // showing the stale pre-expense numbers until a full page reload,
  // since useGroupBalances is a separate hook with its own fetch that
  // nothing told to refresh.
  it('refreshes balances after adding an expense', async () => {
    const u = user()
    render(<GroupDetailPage />)

    await u.type(screen.getByLabelText(/description/i), 'Taxi')
    await u.type(screen.getByLabelText(/amount/i), '12.50')
    await u.click(screen.getByRole('button', { name: /^add expense$/i }))

    await waitFor(() => expect(mockBalancesRefetch).toHaveBeenCalled())
  })

  it('shows an inline error when adding an expense fails', async () => {
    const u = user()
    mockAddExpense.mockRejectedValue(new Error('Expense failed'))
    render(<GroupDetailPage />)

    await u.type(screen.getByLabelText(/description/i), 'Taxi')
    await u.type(screen.getByLabelText(/amount/i), '12.50')
    await u.click(screen.getByRole('button', { name: /^add expense$/i }))

    await waitFor(() => expect(screen.getByText(/expense failed/i)).toBeInTheDocument())
  })

  it('shows an inline error when settling a share fails', async () => {
    const u = user()
    mockSettleShare.mockRejectedValue(new Error('Settle failed'))
    mockBalances = [balance({ userId: 1, name: 'Alice', netBalance: -500 })]
    mockExpenses = [expense({ id: 'e1', description: 'Dinner', paidBy: 2, shares: [{ userId: 1, shareAmount: 500, isSettled: false }] })]
    render(<GroupDetailPage />)

    await u.click(screen.getByRole('button', { name: /mark as settled/i }))

    await waitFor(() => expect(screen.getByText(/settle failed/i)).toBeInTheDocument())
  })
})
