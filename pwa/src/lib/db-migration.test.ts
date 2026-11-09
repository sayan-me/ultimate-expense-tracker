import { describe, it, expect, afterEach } from 'vitest'
import Dexie from 'dexie'
import { ExpenseTrackerDB } from './db'
import { computeAccountBalance } from './account-balance'

// Schema v3 converts money from float dollars to integer cents, and
// renames accounts.balance -> accounts.openingBalance. The critical
// correctness requirement: a user's CURRENT balance (what they see
// today, already reflecting all their past transactions) must come
// out identical after migration — openingBalance is reverse-derived
// as (old balance - net of existing transactions), not just the old
// balance copied over (which would double-count every transaction
// that already contributed to it).

let dbName: string

function uniqueDbName() {
  return `migration-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

afterEach(async () => {
  if (dbName) {
    await Dexie.delete(dbName)
  }
})

// Seeds a database using ONLY the pre-migration (v2) schema and data
// shape, matching exactly what a real pre-migration user's IndexedDB
// would contain.
async function seedV2Database(
  name: string,
  accounts: Array<{ name: string; type: string; balance: number; isDefault?: boolean }>,
  transactions: Array<{ amount: number; type: 'expense' | 'income'; category: string; description: string; accountId: number }>
) {
  const seedDb = new Dexie(name)
  seedDb.version(1).stores({
    transactions: '++id, type, category, date, accountId',
    accounts: '++id, name, type',
  })
  seedDb.version(2).stores({
    transactions: '++id, type, category, date, accountId, amount, createdAt',
    accounts: '++id, name, type, balance, isDefault',
    categories: '++id, name, type, isDefault',
  })
  await seedDb.open()

  const now = new Date()
  for (const a of accounts) {
    await seedDb.table('accounts').add({ ...a, createdAt: now })
  }
  for (const t of transactions) {
    await seedDb.table('transactions').add({ ...t, date: now, createdAt: now, updatedAt: now })
  }
  seedDb.close()
}

describe('Dexie v3 migration — dollars to cents, balance to openingBalance', () => {
  it('converts transaction amounts from float dollars to integer cents', async () => {
    dbName = uniqueDbName()
    await seedV2Database(
      dbName,
      [{ name: 'Cash', type: 'cash', balance: 100, isDefault: true }],
      [{ amount: 25.5, type: 'expense', category: 'Food', description: 'Lunch', accountId: 1 }]
    )

    const db = new ExpenseTrackerDB(dbName)
    await db.open()
    const transactions = await db.transactions.toArray()

    expect(transactions[0].amount).toBe(2550)
    await db.close()
  })

  it('reverse-derives openingBalance so the account\'s CURRENT balance is unchanged by the migration', async () => {
    dbName = uniqueDbName()
    // This account's stored balance ($75.00) already reflects these two
    // transactions, exactly as the pre-migration app's atomic-update
    // code would have left it after they were added.
    await seedV2Database(
      dbName,
      [{ name: 'Cash', type: 'cash', balance: 75, isDefault: true }],
      [
        { amount: 25, type: 'expense', category: 'Food', description: '', accountId: 1 },
        { amount: 10, type: 'income', category: 'Refund', description: '', accountId: 1 },
      ]
    )

    const db = new ExpenseTrackerDB(dbName)
    await db.open()
    const account = (await db.accounts.toArray())[0]
    const transactions = await db.transactions.toArray()

    // openingBalance = 7500 - (-2500 + 1000) = 7500 - (-1500) = 9000
    expect(account.openingBalance).toBe(9000)
    expect('balance' in account).toBe(false)

    // The real continuity check: deriving the balance post-migration
    // must reproduce the exact pre-migration figure (7500 cents = $75).
    expect(computeAccountBalance(account, transactions)).toBe(7500)
    await db.close()
  })

  it('handles an account with no transactions (openingBalance equals the old balance exactly)', async () => {
    dbName = uniqueDbName()
    await seedV2Database(dbName, [{ name: 'Savings', type: 'savings', balance: 500 }], [])

    const db = new ExpenseTrackerDB(dbName)
    await db.open()
    const account = (await db.accounts.toArray())[0]

    expect(account.openingBalance).toBe(50000)
    expect(computeAccountBalance(account, [])).toBe(50000)
    await db.close()
  })

  it('does not cross-contaminate balances between multiple accounts', async () => {
    dbName = uniqueDbName()
    await seedV2Database(
      dbName,
      [
        { name: 'Cash', type: 'cash', balance: 100 },
        { name: 'Bank', type: 'bank', balance: 1000 },
      ],
      [
        { amount: 20, type: 'expense', category: 'Food', description: '', accountId: 1 },
        { amount: 300, type: 'expense', category: 'Rent', description: '', accountId: 2 },
      ]
    )

    const db = new ExpenseTrackerDB(dbName)
    await db.open()
    const accounts = await db.accounts.toArray()
    const transactions = await db.transactions.toArray()
    const cash = accounts.find((a) => a.name === 'Cash')!
    const bank = accounts.find((a) => a.name === 'Bank')!

    expect(computeAccountBalance(cash, transactions)).toBe(10000) // unchanged: $100
    expect(computeAccountBalance(bank, transactions)).toBe(100000) // unchanged: $1000
    await db.close()
  })

  it('supports a negative stored balance (e.g. a credit card already in debt)', async () => {
    dbName = uniqueDbName()
    await seedV2Database(
      dbName,
      [{ name: 'Credit Card', type: 'credit', balance: -150.75 }],
      [{ amount: 50, type: 'expense', category: 'Shopping', description: '', accountId: 1 }]
    )

    const db = new ExpenseTrackerDB(dbName)
    await db.open()
    const account = (await db.accounts.toArray())[0]
    const transactions = await db.transactions.toArray()

    expect(computeAccountBalance(account, transactions)).toBe(-15075)
    await db.close()
  })
})
