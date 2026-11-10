import type { Transaction, Account, Category, Budget, RecurringTransaction } from "./db"

export type SyncTableName = "transactions" | "accounts" | "categories" | "budgets" | "recurringTransactions"
export type SyncableRow = Transaction | Account | Category | Budget | RecurringTransaction
// Omit<SyncableRow, "id"> would collapse to only the fields shared by every
// member of the union (Omit doesn't distribute over a union on its own) —
// this distributes it member-by-member instead, keeping each row's own fields.
type OmitId<T> = T extends SyncableRow ? Omit<T, "id"> : never

/** The JSON shape sent to POST /sync/push and received from GET /sync/pull — see backend/services/user-service/functions/src/sync.ts. */
export interface WireRecord {
  syncId: string
  updatedAt: string
  createdAt?: string
  deletedAt?: string | null
  [key: string]: unknown
}

const TABLES_WITH_ACCOUNT_REF: SyncTableName[] = ["transactions", "recurringTransactions"]

/**
 * Converts a local Dexie row into the wire payload for a push. Returns
 * undefined (skip this row this pass) if it has no syncId yet, or — for a
 * table that references an account — if that account's own syncId can't
 * be resolved yet (e.g. the account was created in the same batch and
 * hasn't been pushed/assigned one before this row was read).
 */
export function toWireRecord(
  table: SyncTableName,
  row: SyncableRow,
  accountSyncIdOf: (localAccountId: number) => string | undefined
): WireRecord | undefined {
  if (!row.syncId) return undefined

  const wire: WireRecord = {
    syncId: row.syncId,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? row.createdAt?.toISOString() ?? new Date().toISOString(),
  }

  if (TABLES_WITH_ACCOUNT_REF.includes(table)) {
    const accountId = (row as Transaction | RecurringTransaction).accountId
    const accountSyncId = accountSyncIdOf(accountId)
    if (!accountSyncId) return undefined
    wire.accountSyncId = accountSyncId
  }

  switch (table) {
    case "transactions": {
      const t = row as Transaction
      Object.assign(wire, {
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        date: t.date.toISOString(),
        transferId: t.transferId,
        tags: t.tags,
      })
      break
    }
    case "accounts": {
      const a = row as Account
      Object.assign(wire, {
        name: a.name,
        type: a.type,
        openingBalance: a.openingBalance,
        isDefault: a.isDefault,
        targetAmount: a.targetAmount,
        targetDate: a.targetDate?.toISOString(),
      })
      break
    }
    case "categories": {
      const c = row as Category
      Object.assign(wire, {
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: c.isDefault,
        type: c.type,
      })
      break
    }
    case "budgets": {
      const b = row as Budget
      Object.assign(wire, {
        category: b.category,
        amount: b.amount,
      })
      break
    }
    case "recurringTransactions": {
      const r = row as RecurringTransaction
      Object.assign(wire, {
        type: r.type,
        category: r.category,
        description: r.description,
        amount: r.amount,
        frequency: r.frequency,
        startDate: r.startDate.toISOString(),
        nextRunDate: r.nextRunDate.toISOString(),
        isActive: r.isActive,
      })
      break
    }
  }

  return wire
}

/**
 * Converts a pulled wire record into the local Dexie row shape (sans the
 * local auto-increment id, which the caller resolves separately by
 * looking up an existing row with this syncId). Returns undefined (skip
 * this record this pass) for a soft-deleted tombstone — applying local
 * soft deletes is a deferred follow-up, not part of this slice — or, for
 * a table that references an account, if that account hasn't been synced
 * down locally yet (the caller should retry on a later pass once it has).
 */
export function fromWireRecord(
  table: SyncTableName,
  record: WireRecord,
  accountIdOf: (accountSyncId: string) => number | undefined
): OmitId<SyncableRow> | undefined {
  if (record.deletedAt) return undefined

  let accountId: number | undefined
  if (TABLES_WITH_ACCOUNT_REF.includes(table)) {
    accountId = accountIdOf(record.accountSyncId as string)
    if (accountId === undefined) return undefined
  }

  const base = {
    syncId: record.syncId,
    createdAt: new Date(record.createdAt ?? record.updatedAt),
    updatedAt: new Date(record.updatedAt),
  }

  switch (table) {
    case "transactions":
      return {
        ...base,
        accountId: accountId!,
        amount: record.amount as number,
        type: record.type as Transaction["type"],
        category: record.category as string,
        description: record.description as string,
        date: new Date(record.date as string),
        transferId: record.transferId as string | undefined,
        tags: record.tags as string[] | undefined,
      } satisfies Omit<Transaction, "id">
    case "accounts":
      return {
        ...base,
        name: record.name as string,
        type: record.type as Account["type"],
        openingBalance: record.openingBalance as number,
        isDefault: record.isDefault as boolean | undefined,
        targetAmount: record.targetAmount as number | undefined,
        targetDate: record.targetDate ? new Date(record.targetDate as string) : undefined,
      } satisfies Omit<Account, "id">
    case "categories":
      return {
        ...base,
        name: record.name as string,
        icon: record.icon as string,
        color: record.color as string,
        isDefault: record.isDefault as boolean,
        type: record.type as Category["type"],
      } satisfies Omit<Category, "id">
    case "budgets":
      return {
        ...base,
        category: record.category as string | null,
        amount: record.amount as number,
      } satisfies Omit<Budget, "id">
    case "recurringTransactions":
      return {
        ...base,
        accountId: accountId!,
        type: record.type as RecurringTransaction["type"],
        category: record.category as string,
        description: record.description as string,
        amount: record.amount as number,
        frequency: record.frequency as RecurringTransaction["frequency"],
        startDate: new Date(record.startDate as string),
        nextRunDate: new Date(record.nextRunDate as string),
        isActive: record.isActive as boolean,
      } satisfies Omit<RecurringTransaction, "id">
  }
}
