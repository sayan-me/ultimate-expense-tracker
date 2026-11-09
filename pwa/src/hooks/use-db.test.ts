import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTransactions, useBudgets } from './use-db'
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
