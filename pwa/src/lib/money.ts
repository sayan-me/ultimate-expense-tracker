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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCents(cents: number): string {
  return currencyFormatter.format(centsToDollars(cents))
}
