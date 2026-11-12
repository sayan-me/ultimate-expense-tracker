import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * A single currency's display info: the symbol shown in simple JSX
 * contexts (e.g. the `$` decorator beside an amount input) and a
 * human-readable name for the settings dropdown.
 *
 * This is a small, fixed starter set — not full ISO 4217 coverage — since
 * this feature is a basic, foundational display preference, not
 * multi-currency accounting.
 *
 * Deliberately no per-currency locale here: formatCents() (lib/money.ts)
 * and formatAmount() (lib/validations/expense.ts) always format with a
 * single fixed locale ("en-US") and only vary Intl.NumberFormat's
 * `currency` option. Pairing each currency with its own regional locale
 * (e.g. EUR -> de-DE) would also change decimal/grouping conventions
 * (e.g. "100,00 €" instead of "€100.00"), which is explicitly out of
 * scope for this feature — a pure currency *symbol* preference, not
 * locale-driven number formatting.
 */
export interface CurrencyInfo {
  /** ISO 4217 currency code, e.g. "USD" */
  code: string
  /** Symbol shown in simple, non-Intl-formatted contexts (e.g. input decorators) */
  symbol: string
  /** Human-readable name for the settings dropdown */
  name: string
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
]

const DEFAULT_CURRENCY_CODE = CURRENCIES[0].code

/** Looks up a currency's display info by code, falling back to the default (USD) for an unknown/unsupported code. */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0]
}

interface PreferencesState {
  /** ISO 4217 code of the currency used to render every money amount in the app */
  currency: string
  /** Update the active display currency */
  setCurrency: (code: string) => void
}

/**
 * Device-level display preferences, persisted to localStorage.
 *
 * This is deliberately separate from the per-profile Dexie database: it's
 * not financial data, it's a rendering preference for this device/browser.
 *
 * Non-React call sites (e.g. formatCents() in lib/money.ts) read the
 * active currency via `usePreferencesStore.getState().currency` rather
 * than the hook, since this store is imported from plain utility modules
 * as well as components.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY_CODE,
      setCurrency: (code) => set({ currency: code }),
    }),
    {
      name: 'preferences-storage',
    }
  )
)

/**
 * Hook for components that only need the active currency's symbol (e.g.
 * the `$`-style decorator shown beside amount inputs), without having to
 * subscribe to the raw currency code and re-derive CurrencyInfo themselves.
 */
export const useCurrencySymbol = (): string =>
  usePreferencesStore((state) => getCurrencyInfo(state.currency).symbol)
