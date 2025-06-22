import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, ExpenseTrackerDB } from './db'

// We'll use ExpenseTrackerDB for type checking and testing database operations
describe('ExpenseTrackerDB', () => {
  let testDb: ExpenseTrackerDB

  beforeEach(() => {
    vi.clearAllMocks()
    testDb = new ExpenseTrackerDB()
  })

  it('adds and retrieves transactions', async () => {
    const transaction = {
      amount: 100,
      type: 'expense' as const,
      category: 'Food',
      description: 'Lunch',
      date: new Date(),
      accountId: 1
    }

    const id = await db.transactions.add(transaction)
    const retrieved = await db.transactions.get(id)

    expect(retrieved).toEqual({ ...transaction, id })
  })

  it('adds and retrieves accounts', async () => {
    const account = {
      name: 'Cash',
      type: 'cash' as const,
      balance: 1000
    }

    const id = await db.accounts.add(account)
    const retrieved = await db.accounts.get(id)

    expect(retrieved).toEqual({ ...account, id })
  })

  it('initializes with correct schema version', () => {
    expect(testDb.verno).toBe(1)
  })
}) 