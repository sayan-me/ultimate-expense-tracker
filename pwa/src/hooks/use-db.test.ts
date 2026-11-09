import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTransactions } from './use-db'
import { db } from '@/lib/db'

// F3 (bug report): editing/deleting a transaction must keep the account
// balance correct via one atomic Dexie transaction, including when the
// transaction moves to a different account.
describe('useTransactions — atomic balance updates', () => {
  let cashId: number
  let bankId: number

  beforeEach(async () => {
    await db.transactions.clear()
    await db.accounts.clear()
    cashId = await db.accounts.add({ name: 'Cash', type: 'cash', balance: 100, createdAt: new Date() })
    bankId = await db.accounts.add({ name: 'Bank', type: 'bank', balance: 200, createdAt: new Date() })
  })

  it('subtracts an expense from its account balance on add', async () => {
    const { result } = renderHook(() => useTransactions())
    let id: number | undefined
    await act(async () => {
      id = await result.current.addTransaction({
        amount: 30,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })
    })

    expect(id).toBeDefined()
    await waitFor(async () => {
      const account = await db.accounts.get(cashId)
      expect(account?.balance).toBe(70)
    })
  })

  it('adds income to its account balance on add', async () => {
    const { result } = renderHook(() => useTransactions())
    await act(async () => {
      await result.current.addTransaction({
        amount: 50,
        type: 'income',
        category: 'Salary',
        description: '',
        accountId: cashId,
        date: new Date(),
      })
    })

    await waitFor(async () => {
      const account = await db.accounts.get(cashId)
      expect(account?.balance).toBe(150)
    })
  })

  it('applies only the delta when the amount changes on the same account', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 30,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect((await db.accounts.get(cashId))?.balance).toBe(70))

    await act(async () => {
      await result.current.updateTransaction(id, { amount: 50 })
    })

    // 100 - 50 = 50 (not 100 - 30 - 50)
    await waitFor(async () => expect((await db.accounts.get(cashId))?.balance).toBe(50))
  })

  it('reverses the old account and applies to the new account when accountId changes', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 30,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect((await db.accounts.get(cashId))?.balance).toBe(70))

    await act(async () => {
      await result.current.updateTransaction(id, { accountId: bankId })
    })

    await waitFor(async () => {
      expect((await db.accounts.get(cashId))?.balance).toBe(100) // reversed
      expect((await db.accounts.get(bankId))?.balance).toBe(170) // applied
    })
  })

  it('restores the balance when a transaction is deleted', async () => {
    const { result } = renderHook(() => useTransactions())
    let id!: number
    await act(async () => {
      id = (await result.current.addTransaction({
        amount: 30,
        type: 'expense',
        category: 'Food',
        description: '',
        accountId: cashId,
        date: new Date(),
      })) as number
    })
    await waitFor(async () => expect((await db.accounts.get(cashId))?.balance).toBe(70))

    await act(async () => {
      await result.current.deleteTransaction(id)
    })

    await waitFor(async () => {
      expect((await db.accounts.get(cashId))?.balance).toBe(100)
      expect(await db.transactions.get(id)).toBeUndefined()
    })
  })
})
