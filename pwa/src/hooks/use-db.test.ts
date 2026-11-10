import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTransactions, useBudgets, useRecurringTransactions, useAccounts, useCategories } from './use-db'
import { db } from '@/lib/db'
import { computeAccountBalance } from '@/lib/account-balance'

// Account balances are derived from openingBalance + the account's own
// transactions, not stored and mutated by these write paths (see
// src/lib/account-balance.ts). So these tests verify add/edit/delete
// write the transaction row correctly and leave openingBalance
// completely untouched; computeAccountBalance is what turns that into
// a current balance, and its own correctness is covered separately in
// account-balance.test.ts.
describe('useTransactions — writes, with balance derived rather than stored', () => {
  let cashId: number
  let bankId: number

  beforeEach(async () => {
    await db.transactions.clear()
    await db.accounts.clear()
    cashId = await db.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 10000, createdAt: new Date() })
    bankId = await db.accounts.add({ name: 'Bank', type: 'bank', openingBalance: 20000, createdAt: new Date() })
  })

  const currentBalance = async (accountId: number) => {
    const account = (await db.accounts.get(accountId))!
    const transactions = await db.transactions.toArray()
    return computeAccountBalance(account, transactions)
  }

  it('an added expense reduces the derived balance, without touching openingBalance', async () => {
    const { result } = renderHook(() => useTransactions())
    let id: number | undefined
    await act(async () => {
      id = await result.current.addTransaction({
        amount: 3000,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })
    })

    expect(id).toBeDefined()
    await waitFor(async () => expect(await currentBalance(cashId)).toBe(7000))
    expect((await db.accounts.get(cashId))?.openingBalance).toBe(10000)
  })

  it('an added income increases the derived balance', async () => {
    const { result } = renderHook(() => useTransactions())
    await act(async () => {
      await result.current.addTransaction({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        description: '',
        accountId: cashId,
        date: new Date(),
      })
    })

    await waitFor(async () => expect(await currentBalance(cashId)).toBe(15000))
  })

  it('editing the amount changes the derived balance by the new amount, not a double adjustment', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 3000,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect(await currentBalance(cashId)).toBe(7000))

    await act(async () => {
      await result.current.updateTransaction(id, { amount: 5000 })
    })

    // 10000 (opening) - 5000 (the new amount) = 5000
    await waitFor(async () => expect(await currentBalance(cashId)).toBe(5000))
  })

  it('moving a transaction to a different account moves its effect on the derived balance too', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 3000,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect(await currentBalance(cashId)).toBe(7000))

    await act(async () => {
      await result.current.updateTransaction(id, { accountId: bankId })
    })

    await waitFor(async () => {
      await expect(currentBalance(cashId)).resolves.toBe(10000) // back to opening, unaffected
    })
    expect(await currentBalance(bankId)).toBe(17000) // 20000 - 3000
  })

  it('deleting a transaction restores the derived balance', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 3000,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect(await currentBalance(cashId)).toBe(7000))

    await act(async () => {
      await result.current.deleteTransaction(id)
    })

    await waitFor(async () => {
      expect(await currentBalance(cashId)).toBe(10000)
    })
    expect(await db.transactions.get(id)).toBeUndefined()
  })

  it('createTransfer moves money between two accounts via a linked transfer_out/transfer_in pair', async () => {
    const { result } = renderHook(() => useTransactions())

    await act(async () => {
      await result.current.createTransfer({
        fromAccountId: cashId,
        toAccountId: bankId,
        amount: 4000,
        date: new Date(),
        description: 'Move to bank',
      })
    })

    await waitFor(async () => expect(await currentBalance(cashId)).toBe(6000)) // 10000 - 4000
    expect(await currentBalance(bankId)).toBe(24000) // 20000 + 4000

    const all = await db.transactions.toArray()
    const out = all.find((t) => t.type === 'transfer_out')!
    const inn = all.find((t) => t.type === 'transfer_in')!
    expect(out.accountId).toBe(cashId)
    expect(inn.accountId).toBe(bankId)
    expect(out.amount).toBe(4000)
    expect(inn.amount).toBe(4000)
    expect(out.transferId).toBeDefined()
    expect(out.transferId).toBe(inn.transferId)
  })

  it('createTransfer rejects transferring an account to itself', async () => {
    const { result } = renderHook(() => useTransactions())

    await expect(
      result.current.createTransfer({
        fromAccountId: cashId,
        toAccountId: cashId,
        amount: 1000,
        date: new Date(),
        description: '',
      })
    ).rejects.toThrow(/same account/i)

    expect(await db.transactions.count()).toBe(0)
  })

  it('createTransfer rejects a non-positive amount', async () => {
    const { result } = renderHook(() => useTransactions())

    await expect(
      result.current.createTransfer({
        fromAccountId: cashId,
        toAccountId: bankId,
        amount: 0,
        date: new Date(),
        description: '',
      })
    ).rejects.toThrow(/positive/i)

    expect(await db.transactions.count()).toBe(0)
  })

  it('sorts recent transactions by date, not createdAt (U6)', async () => {
    // A Nov 7 transaction entered (createdAt) after a Nov 8 one must
    // still sort below it — by the transaction's own date.
    await db.transactions.add({
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: 'Nov 8 expense',
      accountId: cashId,
      date: new Date('2026-11-08T10:00:00'),
      createdAt: new Date('2026-11-08T10:00:00'),
      updatedAt: new Date('2026-11-08T10:00:00'),
    })
    await db.transactions.add({
      amount: 2000,
      type: 'expense',
      category: 'Food',
      description: 'Backfilled Nov 7 expense',
      accountId: cashId,
      date: new Date('2026-11-07T09:00:00'),
      createdAt: new Date('2026-11-08T11:00:00'), // entered later
      updatedAt: new Date('2026-11-08T11:00:00'),
    })

    const { result } = renderHook(() => useTransactions().useRecentTransactions(5))

    await waitFor(() => expect(result.current).toBeDefined())
    expect(result.current?.[0]?.description).toBe('Nov 8 expense')
    expect(result.current?.[1]?.description).toBe('Backfilled Nov 7 expense')
  })

  // Cloud sync (ROADMAP Phase 4) bridges a local row to its cloud
  // counterpart via a syncId the local auto-increment id never carries —
  // every write path that creates a row must assign one.
  it('addTransaction assigns a unique syncId', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 1000,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })

    const stored = await db.transactions.get(id)
    expect(stored?.syncId).toBeTruthy()
  })

  it("createTransfer assigns each leg its own distinct syncId", async () => {
    const { result } = renderHook(() => useTransactions())
    await act(async () => {
      await result.current.createTransfer({
        fromAccountId: cashId,
        toAccountId: bankId,
        amount: 1000,
        date: new Date(),
        description: '',
      })
    })

    const [out, inn] = await db.transactions.toArray()
    expect(out.syncId).toBeTruthy()
    expect(inn.syncId).toBeTruthy()
    expect(out.syncId).not.toBe(inn.syncId)
  })
})

describe('useAccounts', () => {
  beforeEach(async () => {
    await db.accounts.clear()
  })

  it('addAccount assigns a unique syncId', async () => {
    const { result } = renderHook(() => useAccounts())
    let id!: number
    await act(async () => {
      id = (await result.current.addAccount({
        name: 'Cash',
        type: 'cash',
        openingBalance: 0,
      })) as number
    })

    const stored = await db.accounts.get(id)
    expect(stored?.syncId).toBeTruthy()
  })

  it('updateAccount bumps updatedAt so cloud sync can tell this row changed', async () => {
    const { result } = renderHook(() => useAccounts())
    let id!: number
    await act(async () => {
      id = (await result.current.addAccount({ name: 'Cash', type: 'cash', openingBalance: 0 })) as number
    })
    const before = (await db.accounts.get(id))!.updatedAt

    await new Promise((r) => setTimeout(r, 5))
    await act(async () => {
      await result.current.updateAccount(id, { name: 'Checking' })
    })

    const after = (await db.accounts.get(id))!.updatedAt
    expect(after!.getTime()).toBeGreaterThan(before!.getTime())
  })
})

describe('useCategories', () => {
  beforeEach(async () => {
    await db.categories.clear()
    await db.transactions.clear()
  })

  it('addCategory assigns a unique syncId', async () => {
    const { result } = renderHook(() => useCategories())
    let id!: number
    await act(async () => {
      id = (await result.current.addCategory({
        name: 'Food',
        icon: 'utensils',
        color: '#ef4444',
        isDefault: false,
        type: 'expense',
      })) as number
    })

    const stored = await db.categories.get(id)
    expect(stored?.syncId).toBeTruthy()
  })

  it('updateCategory bumps updatedAt so cloud sync can tell this row changed', async () => {
    const { result } = renderHook(() => useCategories())
    let id!: number
    await act(async () => {
      id = (await result.current.addCategory({
        name: 'Food',
        icon: 'utensils',
        color: '#ef4444',
        isDefault: false,
        type: 'expense',
      })) as number
    })
    const before = (await db.categories.get(id))!.updatedAt

    await new Promise((r) => setTimeout(r, 5))
    await act(async () => {
      await result.current.updateCategory(id, { color: '#10b981' })
    })

    const after = (await db.categories.get(id))!.updatedAt
    expect(after!.getTime()).toBeGreaterThan(before!.getTime())
  })
})

describe('useBudgets', () => {
  beforeEach(async () => {
    await db.budgets.clear()
  })

  it('setBudget creates a new overall budget when none exists', async () => {
    const { result } = renderHook(() => useBudgets())
    await act(async () => {
      await result.current.setBudget(null, 400000)
    })

    await waitFor(async () => {
      const all = await db.budgets.toArray()
      expect(all).toHaveLength(1)
      expect(all[0]).toMatchObject({ category: null, amount: 400000 })
    })
  })

  it('setBudget creates a new per-category budget', async () => {
    const { result } = renderHook(() => useBudgets())
    await act(async () => {
      await result.current.setBudget('Food', 50000)
    })

    await waitFor(async () => {
      const all = await db.budgets.toArray()
      expect(all).toHaveLength(1)
      expect(all[0]).toMatchObject({ category: 'Food', amount: 50000 })
    })
  })

  it('setBudget updates the existing row for that category instead of creating a duplicate', async () => {
    const { result } = renderHook(() => useBudgets())
    await act(async () => {
      await result.current.setBudget('Food', 50000)
    })
    await waitFor(async () => expect(await db.budgets.count()).toBe(1))

    await act(async () => {
      await result.current.setBudget('Food', 75000)
    })

    await waitFor(async () => {
      const all = await db.budgets.toArray()
      expect(all).toHaveLength(1)
      expect(all[0].amount).toBe(75000)
    })
  })

  it('setBudget for a category does not affect the overall budget, and vice versa', async () => {
    const { result } = renderHook(() => useBudgets())
    await act(async () => {
      await result.current.setBudget(null, 400000)
      await result.current.setBudget('Food', 50000)
    })

    await waitFor(async () => {
      const all = await db.budgets.toArray()
      expect(all).toHaveLength(2)
    })
  })

  it('deleteBudget removes the budget', async () => {
    const { result } = renderHook(() => useBudgets())
    let id!: number
    await act(async () => {
      id = (await result.current.setBudget('Food', 50000)) as number
    })
    await waitFor(async () => expect(await db.budgets.count()).toBe(1))

    await act(async () => {
      await result.current.deleteBudget(id)
    })

    await waitFor(async () => expect(await db.budgets.count()).toBe(0))
  })

  it('setBudget assigns a unique syncId when creating a new budget', async () => {
    const { result } = renderHook(() => useBudgets())
    let id!: number
    await act(async () => {
      id = (await result.current.setBudget('Food', 50000)) as number
    })

    const stored = await db.budgets.get(id)
    expect(stored?.syncId).toBeTruthy()
  })
})

describe('useRecurringTransactions', () => {
  let accountId: number

  beforeEach(async () => {
    await db.recurringTransactions.clear()
    await db.transactions.clear()
    await db.accounts.clear()
    accountId = await db.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })
  })

  it('addRecurring creates a new recurring transaction', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    await act(async () => {
      await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-11-01T00:00:00'),
        nextRunDate: new Date('2026-11-01T00:00:00'),
        isActive: true,
      })
    })

    await waitFor(async () => {
      const all = await db.recurringTransactions.toArray()
      expect(all).toHaveLength(1)
      expect(all[0]).toMatchObject({ category: 'Subscriptions', amount: 1500, isActive: true })
    })
  })

  it('updateRecurring changes fields, e.g. toggling isActive', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-11-01T00:00:00'),
        nextRunDate: new Date('2026-11-01T00:00:00'),
        isActive: true,
      })) as number
    })

    await act(async () => {
      await result.current.updateRecurring(id, { isActive: false })
    })

    await waitFor(async () => expect((await db.recurringTransactions.get(id))?.isActive).toBe(false))
  })

  it('deleteRecurring removes it', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-11-01T00:00:00'),
        nextRunDate: new Date('2026-11-01T00:00:00'),
        isActive: true,
      })) as number
    })
    await waitFor(async () => expect(await db.recurringTransactions.count()).toBe(1))

    await act(async () => {
      await result.current.deleteRecurring(id)
    })

    await waitFor(async () => expect(await db.recurringTransactions.count()).toBe(0))
  })

  it('runDueRecurringTransactions materializes overdue occurrences into real transactions and advances nextRunDate', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    await act(async () => {
      await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-08-01T00:00:00'),
        nextRunDate: new Date('2026-08-01T00:00:00'),
        isActive: true,
      })
    })

    await act(async () => {
      await result.current.runDueRecurringTransactions(new Date('2026-11-05T00:00:00'))
    })

    await waitFor(async () => {
      const txs = await db.transactions.where('category').equals('Subscriptions').toArray()
      expect(txs).toHaveLength(4) // Aug, Sep, Oct, Nov
    })
    const [updated] = await db.recurringTransactions.toArray()
    expect(updated.nextRunDate).toEqual(new Date('2026-12-01T00:00:00'))
  })

  it('runDueRecurringTransactions does nothing for an inactive recurring transaction', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    await act(async () => {
      await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-08-01T00:00:00'),
        nextRunDate: new Date('2026-08-01T00:00:00'),
        isActive: false,
      })
    })

    await act(async () => {
      await result.current.runDueRecurringTransactions(new Date('2026-11-05T00:00:00'))
    })

    expect(await db.transactions.count()).toBe(0)
  })

  it('runDueRecurringTransactions does nothing when nothing is due yet', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    await act(async () => {
      await result.current.addRecurring({
        accountId,
        type: 'income',
        category: 'Salary',
        description: '',
        amount: 500000,
        frequency: 'monthly',
        startDate: new Date('2026-12-01T00:00:00'),
        nextRunDate: new Date('2026-12-01T00:00:00'),
        isActive: true,
      })
    })

    await act(async () => {
      await result.current.runDueRecurringTransactions(new Date('2026-11-05T00:00:00'))
    })

    expect(await db.transactions.count()).toBe(0)
    const [unchanged] = await db.recurringTransactions.toArray()
    expect(unchanged.nextRunDate).toEqual(new Date('2026-12-01T00:00:00'))
  })

  it('addRecurring assigns a unique syncId', async () => {
    const { result } = renderHook(() => useRecurringTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addRecurring({
        accountId,
        type: 'expense',
        category: 'Subscriptions',
        description: 'Streaming',
        amount: 1500,
        frequency: 'monthly',
        startDate: new Date('2026-11-01T00:00:00'),
        nextRunDate: new Date('2026-11-01T00:00:00'),
        isActive: true,
      })) as number
    })

    const stored = await db.recurringTransactions.get(id)
    expect(stored?.syncId).toBeTruthy()
  })
})

describe('ExpenseTrackerDB — defensive date normalization on read', () => {
  beforeEach(async () => {
    await db.transactions.clear()
    await db.accounts.clear()
  })

  it('does not throw when reading a record that does not exist', async () => {
    await expect(db.transactions.get(999999)).resolves.toBeUndefined()
  })

  it('coerces a non-Date date field (e.g. from malformed/imported data) into a real Date', async () => {
    const accountId = await db.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })
    // Bypass the app's own write path, which always stores real Dates —
    // this simulates data that didn't come from it (a future import
    // feature, or any other source).
    const id = await db.transactions.add({
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: '',
      accountId,
      date: '2026-11-01T00:00:00.000Z' as unknown as Date,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const read = await db.transactions.get(id)
    expect(read?.date).toBeInstanceOf(Date)
    expect(() => read?.date.getFullYear()).not.toThrow()
  })
})
