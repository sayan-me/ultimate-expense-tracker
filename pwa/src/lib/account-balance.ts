import type { Account, Transaction } from "./db"

function signedAmount(type: Transaction["type"], amount: number): number {
  return type === "income" ? amount : -amount
}

/**
 * An account's balance is openingBalance + the sum of its own
 * transactions — derived, not stored and mutated on every
 * add/edit/delete. This makes balance drift structurally impossible
 * instead of depending on every write path staying correct.
 */
export function computeAccountBalance(account: Account, transactions: Transaction[]): number {
  const related = account.id === undefined ? [] : transactions.filter((t) => t.accountId === account.id)
  return related.reduce((sum, t) => sum + signedAmount(t.type, t.amount), account.openingBalance)
}

export function computeTotalBalance(accounts: Account[], transactions: Transaction[]): number {
  return accounts.reduce((sum, account) => sum + computeAccountBalance(account, transactions), 0)
}
