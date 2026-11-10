import Dexie from "dexie"
import { ExpenseTrackerDB, ANONYMOUS_DB_KEY, dbNameForUserKey } from "./db"

export type DbIdentityDecision =
  | { action: "use"; key: string }
  | { action: "prompt-merge"; key: string }

/**
 * Decides what should happen to local data when the active identity
 * (anonymous or a signed-in Firebase uid) changes to `targetKey` — used by
 * DbIdentityGate. Pure decision logic, kept separate from the React
 * component so it's testable without mounting anything.
 *
 * "prompt-merge" only ever happens once per device per user: it fires
 * exactly when targetKey's own database has never been created yet (a
 * first sign-in on this device) AND the anonymous database already has
 * real data worth asking about. Every other case resolves straight to
 * "use" — including every subsequent sign-in by the same user, since
 * their own database exists by then regardless of how the first prompt
 * was answered.
 */
export async function resolveDbIdentity(targetKey: string): Promise<DbIdentityDecision> {
  if (targetKey === ANONYMOUS_DB_KEY) {
    return { action: "use", key: ANONYMOUS_DB_KEY }
  }

  const userDbExists = await Dexie.exists(dbNameForUserKey(targetKey))
  if (userDbExists) {
    return { action: "use", key: targetKey }
  }

  const hasData = await anonymousDataExists()
  return hasData ? { action: "prompt-merge", key: targetKey } : { action: "use", key: targetKey }
}

/**
 * Whether the anonymous (pre-sign-in) local database currently has any
 * real data — used both by resolveDbIdentity (the first-sign-in prompt)
 * and the "attach device data" recovery action in Settings (for anyone
 * who declined that first prompt, or who has since logged more data
 * anonymously on this device).
 */
export async function anonymousDataExists(): Promise<boolean> {
  const anonDbExists = await Dexie.exists(dbNameForUserKey(ANONYMOUS_DB_KEY))
  if (!anonDbExists) return false

  const anonDb = new ExpenseTrackerDB(dbNameForUserKey(ANONYMOUS_DB_KEY))
  try {
    await anonDb.open()
    return (await anonDb.accounts.count()) > 0 || (await anonDb.transactions.count()) > 0
  } finally {
    anonDb.close()
  }
}
