/**
 * All stored monetary values (Transaction.amount, Account.openingBalance)
 * are integer cents, to avoid floating-point drift from repeated dollar
 * arithmetic — summing many float dollar amounts (e.g. account balances
 * across hundreds of transactions) accumulates visible rounding error
 * over time, whereas integer cent arithmetic is exact.
 *
 * Dollars only exist at human-facing edges: the add-expense form's
 * amount input and the CSV file. Convert right at those boundaries.
 */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function centsToDollars(cents: number): number {
  return cents / 100
}

import { usePreferencesStore } from "@/stores/preferences"

// One formatter per currency code, built lazily and cached — Intl.NumberFormat
// construction isn't free, and formatCents() runs on every money render.
const formatterCache = new Map<string, Intl.NumberFormat>()

/**
 * Returns (and caches) an Intl.NumberFormat for the given ISO 4217 currency
 * code. Always formats with a fixed "en-US" locale regardless of currency —
 * only the `currency` option (and therefore the symbol Intl substitutes)
 * varies — so switching currencies changes the symbol shown without also
 * changing decimal/grouping conventions (e.g. comma vs. period), which is
 * out of scope for this feature (see pwa/src/stores/preferences.ts).
 *
 * Decimal digits are pinned to 2 regardless of the currency's own default
 * convention (e.g. JPY normally shows 0): every amount in this app is
 * stored as integer cents, so changing currency only changes how that same
 * stored value is *rendered*, never how many decimal places it has.
 */
export function getCurrencyFormatter(code: string): Intl.NumberFormat {
  let formatter = formatterCache.get(code)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatterCache.set(code, formatter)
  }
  return formatter
}

export function formatCents(cents: number): string {
  // Read directly from the store's state rather than the React hook: this
  // module is a plain utility imported from both components and
  // non-component code (e.g. CSV export), so every existing call site
  // keeps working unchanged with its current signature.
  const { currency } = usePreferencesStore.getState()
  return getCurrencyFormatter(currency).format(centsToDollars(cents))
}
