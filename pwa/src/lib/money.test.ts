import { describe, it, expect, beforeEach } from 'vitest'
import { dollarsToCents, centsToDollars, formatCents } from './money'
import { usePreferencesStore } from '@/stores/preferences'

// All monetary values are stored as integer cents (Dexie/Transaction.amount,
// Account.openingBalance) to avoid floating-point drift from repeated
// dollar arithmetic (e.g. 0.1 + 0.2 !== 0.3). Dollars only exist at the
// human-facing edges: the add-expense form and the CSV file.
describe('dollarsToCents', () => {
  it('converts a whole dollar amount', () => {
    expect(dollarsToCents(42)).toBe(4200)
  })

  it('converts a two-decimal amount', () => {
    expect(dollarsToCents(42.5)).toBe(4250)
  })

  it('rounds a sub-cent amount to the nearest cent', () => {
    expect(dollarsToCents(42.505)).toBe(4251) // rounds half up
    expect(dollarsToCents(42.504)).toBe(4250)
  })

  it('handles the classic 0.1 + 0.2 floating-point case correctly', () => {
    expect(dollarsToCents(0.1 + 0.2)).toBe(30)
  })

  it('converts zero', () => {
    expect(dollarsToCents(0)).toBe(0)
  })

  it('converts a negative amount (sign preserved, not expected in practice but must not throw)', () => {
    expect(dollarsToCents(-5.5)).toBe(-550)
  })

  it('does not accumulate drift across many conversions', () => {
    // A value notorious for float imprecision when handled as dollars.
    let total = 0
    for (let i = 0; i < 10; i++) {
      total += dollarsToCents(0.1)
    }
    expect(total).toBe(100) // 10 * 10 cents, exactly
  })
})

describe('centsToDollars', () => {
  it('converts whole-dollar cents back to a dollar amount', () => {
    expect(centsToDollars(4200)).toBe(42)
  })

  it('converts fractional cents back to a dollar amount', () => {
    expect(centsToDollars(4250)).toBe(42.5)
  })

  it('converts zero', () => {
    expect(centsToDollars(0)).toBe(0)
  })

  it('round-trips through dollarsToCents for typical amounts', () => {
    for (const dollars of [0, 0.01, 1, 9.99, 42.5, 1000, 999999.99]) {
      expect(centsToDollars(dollarsToCents(dollars))).toBeCloseTo(dollars, 2)
    }
  })
})

describe('formatCents', () => {
  beforeEach(() => {
    // formatCents() reads the active currency from the preferences store
    // directly (not via the hook) since it's a plain utility used outside
    // React too. Reset to the default between tests so currency changes
    // made by one test don't leak into the next.
    usePreferencesStore.setState({ currency: 'USD' })
  })

  it('formats a positive amount as currency', () => {
    expect(formatCents(4250)).toBe('$42.50')
  })

  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00')
  })

  it('formats a whole-dollar amount with trailing zeros', () => {
    expect(formatCents(10000)).toBe('$100.00')
  })

  it('formats a negative amount with a leading minus before the currency symbol', () => {
    expect(formatCents(-15075)).toBe('-$150.75')
  })

  it('adds thousands separators for large amounts', () => {
    expect(formatCents(123456789)).toBe('$1,234,567.89')
  })

  it('never shows more than 2 decimal places even for an odd cent value', () => {
    expect(formatCents(1)).toBe('$0.01')
  })

  it('formats using the active currency from the preferences store', () => {
    usePreferencesStore.getState().setCurrency('INR')
    expect(formatCents(4250)).toBe('₹42.50')
  })

  it('re-renders the same stored cents value with the new symbol after switching currency back and forth', () => {
    expect(formatCents(10000)).toBe('$100.00')

    usePreferencesStore.getState().setCurrency('EUR')
    expect(formatCents(10000)).toBe('€100.00')

    usePreferencesStore.getState().setCurrency('USD')
    expect(formatCents(10000)).toBe('$100.00')
  })
})
