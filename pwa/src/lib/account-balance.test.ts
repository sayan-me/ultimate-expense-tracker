import { describe, it, expect } from 'vitest'
import { computeAccountBalance, computeTotalBalance } from './account-balance'
import type { Account, Transaction } from './db'

// Account balances are derived from openingBalance + the sum of that
// account's transactions, not stored/mutated per transaction — this
// makes drift between the stored balance and the transaction history
// structurally impossible instead of relying on every write path
// staying correct.

function account(overrides: Partial<Account> = {}): Account {
  return { id: 1, name: 'Cash', type: 'cash', openingBalance: 0, createdAt: new Date(), ...overrides }
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    amount: 1000,
    type: 'expense',
    category: 'Food',
    description: '',
    date: new Date(),
    accountId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('computeAccountBalance', () => {
  it('equals the opening balance when there are no transactions', () => {
    expect(computeAccountBalance(account({ openingBalance: 5000 }), [])).toBe(5000)
  })

  it('subtracts an expense from the opening balance', () => {
    const acc = account({ openingBalance: 10000 })
    const txs = [tx({ accountId: 1, type: 'expense', amount: 2500 })]
    expect(computeAccountBalance(acc, txs)).toBe(7500)
  })

  it('adds income to the opening balance', () => {
    const acc = account({ openingBalance: 10000 })
    const txs = [tx({ accountId: 1, type: 'income', amount: 2500 })]
    expect(computeAccountBalance(acc, txs)).toBe(12500)
  })

  it('nets multiple mixed transactions', () => {
    const acc = account({ openingBalance: 0 })
    const txs = [
      tx({ accountId: 1, type: 'income', amount: 10000 }),
      tx({ accountId: 1, type: 'expense', amount: 3000 }),
      tx({ accountId: 1, type: 'expense', amount: 1500 }),
    ]
    expect(computeAccountBalance(acc, txs)).toBe(5500)
  })

  it('ignores transactions belonging to a different account', () => {
    const acc = account({ id: 1, openingBalance: 10000 })
    const txs = [
      tx({ accountId: 1, type: 'expense', amount: 1000 }),
      tx({ accountId: 2, type: 'expense', amount: 999999 }), // a different account
    ]
    expect(computeAccountBalance(acc, txs)).toBe(9000)
  })

  it('supports a negative opening balance (e.g. a credit card)', () => {
    const acc = account({ openingBalance: -5000 })
    const txs = [tx({ accountId: 1, type: 'expense', amount: 1000 })]
    expect(computeAccountBalance(acc, txs)).toBe(-6000)
  })

  it('returns just the opening balance for an account with no id (not yet persisted)', () => {
    const acc = account({ id: undefined, openingBalance: 2000 })
    const txs = [tx({ accountId: 1, type: 'expense', amount: 500 })]
    expect(computeAccountBalance(acc, txs)).toBe(2000)
  })
})

describe('computeTotalBalance', () => {
  it('returns 0 for no accounts', () => {
    expect(computeTotalBalance([], [])).toBe(0)
  })

  it('sums the derived balance across multiple accounts', () => {
    const accounts = [
      account({ id: 1, openingBalance: 10000 }),
      account({ id: 2, name: 'Bank', openingBalance: 50000 }),
    ]
    const txs = [
      tx({ accountId: 1, type: 'expense', amount: 1000 }),
      tx({ accountId: 2, type: 'income', amount: 2000 }),
    ]
    // (10000 - 1000) + (50000 + 2000)
    expect(computeTotalBalance(accounts, txs)).toBe(9000 + 52000)
  })
})
