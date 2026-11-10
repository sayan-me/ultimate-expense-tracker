import type { ExpenseTrackerDB } from "./db"

/**
 * Moves every row from the anonymous (pre-sign-in) local database into a
 * signed-in user's own database — offered the first time a user signs in
 * on a device that already has unclaimed local data (see
 * DbIdentityGate), and again later from a recovery action for anyone who
 * declined that first prompt. A move, not a copy: the source database is
 * cleared once everything has landed in the target, so running this
 * again later (e.g. from that recovery action) is always safe and never
 * creates duplicates — there's nothing left in the source to re-copy.
 *
 * Accounts are copied first so transactions/recurringTransactions, which
 * reference an account by its local auto-increment id, can have that id
 * remapped to the account's new id in the target database — the two
 * databases' auto-increment counters are independent, so a row's old and
 * new id are not interchangeable.
 */
export async function mergeAnonymousDataIntoUserDb(anonDb: ExpenseTrackerDB, userDb: ExpenseTrackerDB): Promise<void> {
  const accountIdMap = new Map<number, number>()

  for (const account of await anonDb.accounts.toArray()) {
    const { id: oldId, ...rest } = account
    const newId = await userDb.accounts.add(rest)
    if (oldId !== undefined) accountIdMap.set(oldId, newId)
  }

  for (const category of await anonDb.categories.toArray()) {
    await userDb.categories.add({ ...category, id: undefined })
  }

  for (const budget of await anonDb.budgets.toArray()) {
    await userDb.budgets.add({ ...budget, id: undefined })
  }

  for (const transaction of await anonDb.transactions.toArray()) {
    const accountId = accountIdMap.get(transaction.accountId) ?? transaction.accountId
    await userDb.transactions.add({ ...transaction, id: undefined, accountId })
  }

  for (const recurring of await anonDb.recurringTransactions.toArray()) {
    const accountId = accountIdMap.get(recurring.accountId) ?? recurring.accountId
    await userDb.recurringTransactions.add({ ...recurring, id: undefined, accountId })
  }

  await anonDb.transactions.clear()
  await anonDb.recurringTransactions.clear()
  await anonDb.budgets.clear()
  await anonDb.categories.clear()
  await anonDb.accounts.clear()
}
