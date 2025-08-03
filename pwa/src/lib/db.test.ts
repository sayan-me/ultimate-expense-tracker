import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, ExpenseTrackerDB } from './db'

// We'll use ExpenseTrackerDB for type checking and testing database operations
describe('ExpenseTrackerDB', () => {
  let testDb: ExpenseTrackerDB

  beforeEach(() => {
    vi.clearAllMocks()
    testDb = new ExpenseTrackerDB()
  })

  it('adds and retrieves transactions with timestamps', async () => {
    const now = new Date()
    const transaction = {
      amount: 100,
      type: 'expense' as const,
      category: 'Food',
      description: 'Lunch',
      date: now,
      accountId: 1,
      createdAt: now,
      updatedAt: now
    }

    const id = await db.transactions.add(transaction)
    const retrieved = await db.transactions.get(id)

    expect(retrieved).toMatchObject({ 
      ...transaction, 
      id,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    })
  })

  it('adds and retrieves accounts with timestamps', async () => {
    const now = new Date()
    const account = {
      name: 'Cash',
      type: 'cash' as const,
      balance: 1000,
      isDefault: true,
      createdAt: now
    }

    const id = await db.accounts.add(account)
    const retrieved = await db.accounts.get(id)

    expect(retrieved).toMatchObject({ 
      ...account, 
      id,
      createdAt: expect.any(Date)
    })
  })

  it('adds and retrieves categories', async () => {
    const now = new Date()
    const category = {
      name: 'Food',
      icon: 'utensils',
      color: '#ef4444',
      isDefault: true,
      type: 'expense' as const,
      createdAt: now
    }

    const id = await db.categories.add(category)
    const retrieved = await db.categories.get(id)

    expect(retrieved).toMatchObject({ 
      ...category, 
      id,
      createdAt: expect.any(Date)
    })
  })

  it('initializes with correct schema version', () => {
    expect(testDb.verno).toBe(2)
  })

  it('has all required tables', () => {
    expect(testDb.tables.map(t => t.name)).toEqual(
      expect.arrayContaining(['transactions', 'accounts', 'categories'])
    )
  })
}) 