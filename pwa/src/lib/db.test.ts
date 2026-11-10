import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Dexie from 'dexie'
import { db, getDb, ExpenseTrackerDB, setActiveDbUser, dbNameForUserKey, ANONYMOUS_DB_KEY } from './db'

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
      openingBalance: 1000,
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
    expect(testDb.verno).toBe(7)
  })

  it('has all required tables', () => {
    expect(testDb.tables.map(t => t.name)).toEqual(
      expect.arrayContaining(['transactions', 'accounts', 'categories'])
    )
  })
})

// F1 in the real-user test report: local data was never scoped to who's
// signed in at all — one fixed-name Dexie database for the whole browser,
// regardless of Firebase Auth state. `db`/`getDb()` now resolve to a
// per-identity instance (switched via setActiveDbUser), so every existing
// call site (use-db.ts, db-initialization.ts, offline-sync.ts, ...) gets
// per-user data for free without needing to change how they read `db`.
describe('per-user db switching', () => {
  const dbNamesToCleanUp: string[] = []

  afterEach(async () => {
    setActiveDbUser(ANONYMOUS_DB_KEY)
    for (const name of dbNamesToCleanUp) {
      await Dexie.delete(name)
    }
    dbNamesToCleanUp.length = 0
  })

  it('defaults to the anonymous db key', async () => {
    dbNamesToCleanUp.push(dbNameForUserKey(ANONYMOUS_DB_KEY))
    const id = await db.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })
    expect(await getDb().accounts.get(id)).toBeTruthy()
    expect(getDb().name).toBe(dbNameForUserKey(ANONYMOUS_DB_KEY))
  })

  it('switching the active user points db/getDb at a different, isolated database', async () => {
    dbNamesToCleanUp.push(dbNameForUserKey(ANONYMOUS_DB_KEY), dbNameForUserKey('user-abc'))

    const anonId = await db.accounts.add({ name: 'Anon Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })

    setActiveDbUser('user-abc')
    expect(getDb().name).toBe(dbNameForUserKey('user-abc'))
    expect(await db.accounts.get(anonId)).toBeUndefined() // a different database, not the same rows

    const userId = await db.accounts.add({ name: 'User Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })
    expect((await db.accounts.get(userId))?.name).toBe('User Cash')

    setActiveDbUser(ANONYMOUS_DB_KEY)
    // Auto-increment ids restart at 1 in each separate database, so
    // `userId` isn't a meaningful id to look up here — check the whole
    // table instead: only the one anonymous row, not the user's row too.
    const anonAccounts = await db.accounts.toArray()
    expect(anonAccounts).toHaveLength(1)
    expect(anonAccounts[0].name).toBe('Anon Cash')
  })

  it('switching back to a previously-active user reuses the same cached instance, not a fresh empty one', async () => {
    dbNamesToCleanUp.push(dbNameForUserKey(ANONYMOUS_DB_KEY), dbNameForUserKey('user-abc'))

    setActiveDbUser('user-abc')
    const id = await db.accounts.add({ name: 'User Cash', type: 'cash', openingBalance: 0, createdAt: new Date() })

    setActiveDbUser(ANONYMOUS_DB_KEY)
    setActiveDbUser('user-abc')

    expect((await db.accounts.get(id))?.name).toBe('User Cash')
  })
})