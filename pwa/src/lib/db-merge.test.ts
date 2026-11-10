import { describe, it, expect, afterEach } from 'vitest'
import { ExpenseTrackerDB } from './db'
import { mergeAnonymousDataIntoUserDb } from './db-merge'

describe('mergeAnonymousDataIntoUserDb', () => {
  let anonDb: ExpenseTrackerDB
  let userDb: ExpenseTrackerDB

  afterEach(async () => {
    await anonDb?.delete()
    await userDb?.delete()
  })

  function fresh(name: string) {
    return new ExpenseTrackerDB(name)
  }

  it('copies accounts, categories, budgets, transactions, and recurring transactions into the target db', async () => {
    anonDb = fresh('merge-test-anon-1')
    userDb = fresh('merge-test-user-1')
    await anonDb.open()
    await userDb.open()

    const now = new Date()
    const accountId = await anonDb.accounts.add({
      name: 'Cash', type: 'cash', openingBalance: 10000, isDefault: true, createdAt: now, updatedAt: now, syncId: 'a1',
    })
    await anonDb.categories.add({
      name: 'Food', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense', createdAt: now, updatedAt: now, syncId: 'c1',
    })
    await anonDb.budgets.add({ category: null, amount: 50000, createdAt: now, updatedAt: now, syncId: 'b1' })
    await anonDb.transactions.add({
      amount: 2000, type: 'expense', category: 'Food', description: 'Lunch', date: now, accountId, createdAt: now, updatedAt: now, syncId: 't1',
    })
    await anonDb.recurringTransactions.add({
      accountId, type: 'expense', category: 'Subscriptions', description: 'Streaming', amount: 1500,
      frequency: 'monthly', startDate: now, nextRunDate: now, isActive: true, createdAt: now, updatedAt: now, syncId: 'r1',
    })

    await mergeAnonymousDataIntoUserDb(anonDb, userDb)

    expect(await userDb.accounts.count()).toBe(1)
    expect(await userDb.categories.count()).toBe(1)
    expect(await userDb.budgets.count()).toBe(1)
    expect(await userDb.transactions.count()).toBe(1)
    expect(await userDb.recurringTransactions.count()).toBe(1)
  })

  it('remaps accountId references on the copied transactions to the new account rows', async () => {
    anonDb = fresh('merge-test-anon-2')
    userDb = fresh('merge-test-user-2')
    await anonDb.open()
    await userDb.open()

    const now = new Date()
    // Pre-seed the target db with an unrelated account first, so the
    // copied account's new id will NOT coincidentally match its old id —
    // a real test of remapping, not an accident of both starting at 1.
    await userDb.accounts.add({ name: 'Unrelated', type: 'cash', openingBalance: 0, createdAt: now, updatedAt: now, syncId: 'x' })

    const accountId = await anonDb.accounts.add({
      name: 'Cash', type: 'cash', openingBalance: 10000, createdAt: now, updatedAt: now, syncId: 'a1',
    })
    await anonDb.transactions.add({
      amount: 2000, type: 'expense', category: 'Food', description: 'Lunch', date: now, accountId, createdAt: now, updatedAt: now, syncId: 't1',
    })

    await mergeAnonymousDataIntoUserDb(anonDb, userDb)

    const [copiedAccount] = await userDb.accounts.where('name').equals('Cash').toArray()
    const [copiedTransaction] = await userDb.transactions.toArray()
    expect(copiedAccount.id).not.toBe(accountId) // proves the id actually changed
    expect(copiedTransaction.accountId).toBe(copiedAccount.id)
  })

  it('remaps accountId on copied recurring transactions too', async () => {
    anonDb = fresh('merge-test-anon-3')
    userDb = fresh('merge-test-user-3')
    await anonDb.open()
    await userDb.open()

    const now = new Date()
    await userDb.accounts.add({ name: 'Unrelated', type: 'cash', openingBalance: 0, createdAt: now, updatedAt: now, syncId: 'x' })
    const accountId = await anonDb.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: now, updatedAt: now, syncId: 'a1' })
    await anonDb.recurringTransactions.add({
      accountId, type: 'expense', category: 'Subscriptions', description: 'Streaming', amount: 1500,
      frequency: 'monthly', startDate: now, nextRunDate: now, isActive: true, createdAt: now, updatedAt: now, syncId: 'r1',
    })

    await mergeAnonymousDataIntoUserDb(anonDb, userDb)

    const [copiedAccount] = await userDb.accounts.where('name').equals('Cash').toArray()
    const [copiedRecurring] = await userDb.recurringTransactions.toArray()
    expect(copiedRecurring.accountId).toBe(copiedAccount.id)
  })

  it('does not touch or clear the source (anonymous) database', async () => {
    anonDb = fresh('merge-test-anon-4')
    userDb = fresh('merge-test-user-4')
    await anonDb.open()
    await userDb.open()

    const now = new Date()
    await anonDb.accounts.add({ name: 'Cash', type: 'cash', openingBalance: 0, createdAt: now, updatedAt: now, syncId: 'a1' })

    await mergeAnonymousDataIntoUserDb(anonDb, userDb)

    expect(await anonDb.accounts.count()).toBe(1)
  })

  it('does nothing and does not error when the source database is empty', async () => {
    anonDb = fresh('merge-test-anon-5')
    userDb = fresh('merge-test-user-5')
    await anonDb.open()
    await userDb.open()

    await expect(mergeAnonymousDataIntoUserDb(anonDb, userDb)).resolves.not.toThrow()
    expect(await userDb.accounts.count()).toBe(0)
  })
})
