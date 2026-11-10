import { describe, it, expect } from 'vitest'
import { toWireRecord, fromWireRecord } from './sync-mapping'
import type { Transaction, Account, Budget, RecurringTransaction, Category } from './db'

describe('toWireRecord', () => {
  it('maps a transaction, resolving its local accountId to the account\'s syncId', () => {
    const tx: Transaction = {
      id: 1,
      syncId: 'tx-sync-1',
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      date: new Date('2026-11-01T00:00:00.000Z'),
      accountId: 5,
      tags: ['Essential'],
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-02T00:00:00.000Z'),
    }
    const wire = toWireRecord('transactions', tx, (localId) => (localId === 5 ? 'account-sync-5' : undefined))

    expect(wire).toMatchObject({
      syncId: 'tx-sync-1',
      accountSyncId: 'account-sync-5',
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      date: '2026-11-01T00:00:00.000Z',
      tags: ['Essential'],
      updatedAt: '2026-11-02T00:00:00.000Z',
    })
    expect(wire).not.toHaveProperty('accountId')
  })

  it('returns undefined for a transaction whose account syncId cannot be resolved yet', () => {
    const tx: Transaction = {
      id: 1,
      syncId: 'tx-sync-1',
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: '',
      date: new Date(),
      accountId: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(toWireRecord('transactions', tx, () => undefined)).toBeUndefined()
  })

  it('maps an account (no accountId resolution needed)', () => {
    const account: Account = {
      id: 1,
      syncId: 'acc-sync-1',
      name: 'Cash',
      type: 'cash',
      openingBalance: 10000,
      isDefault: true,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-02T00:00:00.000Z'),
    }
    const wire = toWireRecord('accounts', account, () => undefined)

    expect(wire).toMatchObject({
      syncId: 'acc-sync-1',
      name: 'Cash',
      type: 'cash',
      openingBalance: 10000,
      isDefault: true,
      updatedAt: '2026-11-02T00:00:00.000Z',
    })
  })

  it('maps a category', () => {
    const category: Category = {
      id: 1,
      syncId: 'cat-sync-1',
      name: 'Food',
      icon: 'utensils',
      color: '#ef4444',
      isDefault: true,
      type: 'expense',
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-02T00:00:00.000Z'),
    }
    const wire = toWireRecord('categories', category, () => undefined)
    expect(wire).toMatchObject({ syncId: 'cat-sync-1', name: 'Food', icon: 'utensils', color: '#ef4444', isDefault: true, type: 'expense' })
  })

  it('maps a budget', () => {
    const budget: Budget = {
      id: 1,
      syncId: 'bud-sync-1',
      category: null,
      amount: 50000,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-02T00:00:00.000Z'),
    }
    const wire = toWireRecord('budgets', budget, () => undefined)
    expect(wire).toMatchObject({ syncId: 'bud-sync-1', category: null, amount: 50000 })
  })

  it('maps a recurring transaction, resolving its local accountId too', () => {
    const recurring: RecurringTransaction = {
      id: 1,
      syncId: 'rec-sync-1',
      accountId: 5,
      type: 'expense',
      category: 'Subscriptions',
      description: 'Streaming',
      amount: 1500,
      frequency: 'monthly',
      startDate: new Date('2026-11-01T00:00:00.000Z'),
      nextRunDate: new Date('2026-12-01T00:00:00.000Z'),
      isActive: true,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    }
    const wire = toWireRecord('recurringTransactions', recurring, (localId) => (localId === 5 ? 'account-sync-5' : undefined))
    expect(wire).toMatchObject({ syncId: 'rec-sync-1', accountSyncId: 'account-sync-5', frequency: 'monthly', isActive: true })
  })

  it('returns undefined for any row missing a syncId (not yet assigned locally)', () => {
    const account: Account = {
      id: 1,
      name: 'Cash',
      type: 'cash',
      openingBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(toWireRecord('accounts', account, () => undefined)).toBeUndefined()
  })
})

describe('fromWireRecord', () => {
  it('maps a pulled transaction, resolving its accountSyncId back to a local accountId', () => {
    const wire = {
      syncId: 'tx-sync-1',
      accountSyncId: 'account-sync-5',
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      date: '2026-11-01T00:00:00.000Z',
      tags: ['Essential'],
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
      deletedAt: null,
    }
    const row = fromWireRecord('transactions', wire, (syncId) => (syncId === 'account-sync-5' ? 5 : undefined))

    expect(row).toMatchObject({
      syncId: 'tx-sync-1',
      accountId: 5,
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: 'Lunch',
      tags: ['Essential'],
    })
    expect(row?.date).toBeInstanceOf(Date)
    expect(row?.createdAt).toBeInstanceOf(Date)
    expect(row?.updatedAt).toBeInstanceOf(Date)
  })

  it('returns undefined for a pulled transaction whose account has not been synced down yet', () => {
    const wire = {
      syncId: 'tx-sync-1',
      accountSyncId: 'account-sync-unknown',
      amount: 1000,
      type: 'expense',
      category: 'Food',
      description: '',
      date: '2026-11-01T00:00:00.000Z',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
      deletedAt: null,
    }
    expect(fromWireRecord('transactions', wire, () => undefined)).toBeUndefined()
  })

  it('returns undefined (skips) a soft-deleted record — local soft-delete support is a deferred follow-up', () => {
    const wire = {
      syncId: 'bud-sync-1',
      category: null,
      amount: 50000,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
      deletedAt: '2026-11-03T00:00:00.000Z',
    }
    expect(fromWireRecord('budgets', wire, () => undefined)).toBeUndefined()
  })

  it('maps a pulled account', () => {
    const wire = {
      syncId: 'acc-sync-1',
      name: 'Cash',
      type: 'cash',
      openingBalance: 10000,
      isDefault: true,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
      deletedAt: null,
    }
    const row = fromWireRecord('accounts', wire, () => undefined)
    expect(row).toMatchObject({ syncId: 'acc-sync-1', name: 'Cash', type: 'cash', openingBalance: 10000, isDefault: true })
    expect(row?.createdAt).toBeInstanceOf(Date)
  })
})
