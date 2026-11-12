import { describe, it, expect, beforeEach } from 'vitest'
import { usePreferencesStore, CURRENCIES, getCurrencyInfo } from '../preferences'

// This is a device-level display preference (persisted to localStorage),
// not financial data, so it lives in its own store rather than the
// per-profile Dexie database. See pwa/src/lib/money.ts for how
// formatCents() reads this store's state outside of React.
describe('Preferences Store', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ currency: 'USD' })
  })

  it('defaults to USD', () => {
    expect(usePreferencesStore.getState().currency).toBe('USD')
  })

  it('sets the currency', () => {
    usePreferencesStore.getState().setCurrency('INR')
    expect(usePreferencesStore.getState().currency).toBe('INR')
  })

  it('persists the currency to localStorage under the preferences-storage key', () => {
    usePreferencesStore.getState().setCurrency('EUR')

    const persisted = JSON.parse(localStorage.getItem('preferences-storage') ?? '{}')
    expect(persisted.state.currency).toBe('EUR')
  })
})

describe('CURRENCIES', () => {
  it('includes a small, fixed starter set of common currencies', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(10)
    expect(CURRENCIES.length).toBeLessThanOrEqual(20)
  })

  it('includes USD, INR, EUR and GBP with their symbols', () => {
    expect(CURRENCIES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'USD', symbol: '$' }),
        expect.objectContaining({ code: 'INR', symbol: '₹' }),
        expect.objectContaining({ code: 'EUR', symbol: '€' }),
        expect.objectContaining({ code: 'GBP', symbol: '£' }),
      ])
    )
  })

  it('every currency has a code, symbol and name', () => {
    for (const currency of CURRENCIES) {
      expect(currency.code).toBeTruthy()
      expect(currency.symbol).toBeTruthy()
      expect(currency.name).toBeTruthy()
    }
  })
})

describe('getCurrencyInfo', () => {
  it('returns the matching currency info for a known code', () => {
    expect(getCurrencyInfo('INR')).toEqual(
      expect.objectContaining({ code: 'INR', symbol: '₹' })
    )
  })

  it('falls back to the first (default) currency for an unknown code', () => {
    expect(getCurrencyInfo('XXX')).toEqual(CURRENCIES[0])
  })
})
