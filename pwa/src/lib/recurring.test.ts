import { describe, it, expect } from 'vitest'
import { nextOccurrence, materializeDueRecurring } from './recurring'
import type { RecurringTransaction } from './db'

function recurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 1,
    accountId: 1,
    type: 'expense',
    category: 'Subscriptions',
    description: 'Streaming service',
    amount: 1500,
    frequency: 'monthly',
    startDate: new Date('2026-01-01T00:00:00'),
    nextRunDate: new Date('2026-01-01T00:00:00'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00'),
    updatedAt: new Date('2026-01-01T00:00:00'),
    ...overrides,
  }
}

describe('nextOccurrence', () => {
  it('advances by one day for daily', () => {
    expect(nextOccurrence(new Date('2026-11-05T10:00:00'), 'daily')).toEqual(new Date('2026-11-06T10:00:00'))
  })

  it('advances by one week for weekly', () => {
    expect(nextOccurrence(new Date('2026-11-05T10:00:00'), 'weekly')).toEqual(new Date('2026-11-12T10:00:00'))
  })

  it('advances by one month for monthly', () => {
    expect(nextOccurrence(new Date('2026-11-05T10:00:00'), 'monthly')).toEqual(new Date('2026-12-05T10:00:00'))
  })

  it('handles a monthly advance across a shorter month (Jan 31 -> Feb 28)', () => {
    expect(nextOccurrence(new Date('2026-01-31T00:00:00'), 'monthly')).toEqual(new Date('2026-02-28T00:00:00'))
  })
})

describe('materializeDueRecurring', () => {
  it('produces nothing when nextRunDate is still in the future', () => {
    const r = recurring({ nextRunDate: new Date('2026-12-01T00:00:00') })
    const result = materializeDueRecurring(r, new Date('2026-11-05T00:00:00'))
    expect(result.transactions).toHaveLength(0)
    expect(result.nextRunDate).toEqual(r.nextRunDate)
  })

  it('produces nothing for an inactive recurring transaction, even if overdue', () => {
    const r = recurring({ isActive: false, nextRunDate: new Date('2026-01-01T00:00:00') })
    const result = materializeDueRecurring(r, new Date('2026-11-05T00:00:00'))
    expect(result.transactions).toHaveLength(0)
    expect(result.nextRunDate).toEqual(r.nextRunDate)
  })

  it('produces exactly one transaction when nextRunDate is today', () => {
    const r = recurring({ nextRunDate: new Date('2026-11-05T00:00:00'), frequency: 'monthly' })
    const result = materializeDueRecurring(r, new Date('2026-11-05T00:00:00'))
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]).toMatchObject({
      accountId: 1,
      type: 'expense',
      category: 'Subscriptions',
      description: 'Streaming service',
      amount: 1500,
      date: new Date('2026-11-05T00:00:00'),
    })
    expect(result.nextRunDate).toEqual(new Date('2026-12-05T00:00:00'))
  })

  it('catches up multiple missed monthly occurrences when the app was not opened for a while', () => {
    const r = recurring({ nextRunDate: new Date('2026-08-01T00:00:00'), frequency: 'monthly' })
    const result = materializeDueRecurring(r, new Date('2026-11-05T00:00:00'))
    // Aug 1, Sep 1, Oct 1, Nov 1 are all <= Nov 5
    expect(result.transactions).toHaveLength(4)
    expect(result.transactions.map((t) => t.date)).toEqual([
      new Date('2026-08-01T00:00:00'),
      new Date('2026-09-01T00:00:00'),
      new Date('2026-10-01T00:00:00'),
      new Date('2026-11-01T00:00:00'),
    ])
    expect(result.nextRunDate).toEqual(new Date('2026-12-01T00:00:00'))
  })

  it('caps the number of catch-up occurrences in one run as a safety bound, resuming on the next run', () => {
    const r = recurring({ nextRunDate: new Date('2020-01-01T00:00:00'), frequency: 'daily' })
    const result = materializeDueRecurring(r, new Date('2026-11-05T00:00:00'))
    expect(result.transactions.length).toBeLessThanOrEqual(1000)
    expect(result.transactions.length).toBeGreaterThan(0)
    // nextRunDate only advanced past the last generated occurrence, not
    // all the way to today — the remainder catches up on a later run.
    expect(result.nextRunDate.getTime()).toBeLessThan(new Date('2026-11-05T00:00:00').getTime())
  })
})
