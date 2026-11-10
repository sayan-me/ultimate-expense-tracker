import { describe, it, expect, afterEach } from 'vitest'
import Dexie from 'dexie'
import { ExpenseTrackerDB, ANONYMOUS_DB_KEY, dbNameForUserKey } from './db'
import { resolveDbIdentity } from './db-identity'

describe('resolveDbIdentity', () => {
  const cleanupNames: string[] = []

  afterEach(async () => {
    for (const name of cleanupNames) {
      await Dexie.delete(name)
    }
    cleanupNames.length = 0
  })

  it('resolves to "use" the anonymous key directly, with no checks needed', async () => {
    const decision = await resolveDbIdentity(ANONYMOUS_DB_KEY)
    expect(decision).toEqual({ action: 'use', key: ANONYMOUS_DB_KEY })
  })

  it('resolves to "use" a user key whose own database already exists (returning user)', async () => {
    cleanupNames.push(dbNameForUserKey('user-1'))
    const userDb = new ExpenseTrackerDB(dbNameForUserKey('user-1'))
    await userDb.open()
    await userDb.close()

    const decision = await resolveDbIdentity('user-1')
    expect(decision).toEqual({ action: 'use', key: 'user-1' })
  })

  it('resolves to "use" a brand-new user key when there is no anonymous database at all', async () => {
    const decision = await resolveDbIdentity('user-new')
    expect(decision).toEqual({ action: 'use', key: 'user-new' })
  })

  it('resolves to "use" a brand-new user key when the anonymous database exists but is empty', async () => {
    cleanupNames.push(dbNameForUserKey(ANONYMOUS_DB_KEY))
    const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
    await anonDb.open()
    await anonDb.close()

    const decision = await resolveDbIdentity('user-new')
    expect(decision).toEqual({ action: 'use', key: 'user-new' })
  })

  it('resolves to "prompt-merge" a brand-new user key when the anonymous database has account data', async () => {
    cleanupNames.push(dbNameForUserKey(ANONYMOUS_DB_KEY))
    const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
    await anonDb.open()
    await anonDb.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: new Date(), updatedAt: new Date() })
    await anonDb.close()

    const decision = await resolveDbIdentity('user-new')
    expect(decision).toEqual({ action: 'prompt-merge', key: 'user-new' })
  })

  it('resolves to "prompt-merge" when the anonymous database has transaction data even with no accounts left', async () => {
    cleanupNames.push(dbNameForUserKey(ANONYMOUS_DB_KEY))
    const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
    await anonDb.open()
    await anonDb.transactions.add({
      amount: 100, type: 'expense', category: 'Food', description: '', date: new Date(), accountId: 1,
      createdAt: new Date(), updatedAt: new Date(),
    })
    await anonDb.close()

    const decision = await resolveDbIdentity('user-new')
    expect(decision).toEqual({ action: 'prompt-merge', key: 'user-new' })
  })
})
