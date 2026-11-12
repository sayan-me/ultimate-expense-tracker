import { create } from "zustand"
import { db } from "@/lib/db"
import { toWireRecord, fromWireRecord, type SyncTableName, type WireRecord, type SyncableRow } from "@/lib/sync-mapping"
import { authService } from "@/services/auth.service"
import { env } from "@/config/env"

type SyncStatus = "idle" | "syncing" | "error"

interface OfflineSyncState {
  isOnline: boolean
  lastSyncedAt: Date | null
  syncStatus: SyncStatus
  lastError: string | null
  setOnline: (isOnline: boolean) => void
  syncNow: () => Promise<void>
}

// Accounts must be pulled (and written to Dexie) before transactions and
// recurringTransactions, since those reference an account by syncId and
// need the account's local row to already exist to resolve it.
const SYNCED_TABLES: SyncTableName[] = ["accounts", "categories", "budgets", "transactions", "recurringTransactions"]

// A push is split into requests of at most this many records — a bulk
// import can produce thousands of changed rows in one sync pass, and one
// unbounded request risks an oversized payload and loses everything on a
// single failure. The backend (sync.ts) also chunks its own DB calls
// internally regardless of how many records arrive in one request; this
// is a second, independent layer of safety on the client side.
const PUSH_BATCH_SIZE = 250

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

async function pullTable(table: SyncTableName, since: Date | null, token: string, accountIdBySyncId: Map<string, number>) {
  const url = `${env.api.userServiceUrl}/sync/pull?table=${table}&since=${(since ?? new Date(0)).toISOString()}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`Pull failed for ${table}`)
  const {records} = (await response.json()) as {records: WireRecord[]}

  for (const record of records) {
    const row = fromWireRecord(table, record, (syncId) => accountIdBySyncId.get(syncId))
    if (!row) continue

    const dexieTable = db[table] as unknown as { where: (k: string) => { equals: (v: string) => { first: () => Promise<SyncableRow | undefined> } }; update: (id: number, changes: unknown) => Promise<number>; add: (row: unknown) => Promise<number> }
    const existing = await dexieTable.where("syncId").equals(row.syncId!).first()

    if (existing) {
      const existingUpdatedAt = (existing.updatedAt ?? existing.createdAt) as Date
      if (row.updatedAt! > existingUpdatedAt) {
        await dexieTable.update(existing.id!, row)
      }
    } else {
      const newId = await dexieTable.add(row)
      if (table === "accounts") accountIdBySyncId.set(row.syncId!, newId)
    }
  }
}

async function pushTable(table: SyncTableName, since: Date | null, token: string, accountSyncIdByLocalId: Map<number, string>) {
  const rows = (await (db[table] as unknown as {toArray: () => Promise<SyncableRow[]>}).toArray()).filter(
    (row) => !since || (row.updatedAt ?? row.createdAt)! > since
  )
  const records = rows
    .map((row) => toWireRecord(table, row, (localId) => accountSyncIdByLocalId.get(localId)))
    .filter((r): r is WireRecord => r !== undefined)

  if (records.length === 0) return

  for (const batch of chunk(records, PUSH_BATCH_SIZE)) {
    const response = await fetch(`${env.api.userServiceUrl}/sync/push`, {
      method: "POST",
      headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
      body: JSON.stringify({table, records: batch}),
    })
    if (!response.ok) throw new Error(`Push failed for ${table}`)
  }
}

export const useOfflineSyncStore = create<OfflineSyncState>()((set, get) => ({
  // Deliberately NOT read from navigator here: this module can run during
  // SSR, where Node's own global `navigator` exists but has no `.onLine`
  // (unlike a real browser's), so reading it at init time made the
  // server-rendered isOnline silently diverge from the client's, causing
  // a hydration mismatch (the sync indicator differed between SSR and
  // hydration). db-context.tsx corrects this to the real value in a
  // client-only effect right after mount instead.
  isOnline: true,
  lastSyncedAt: null,
  syncStatus: "idle",
  lastError: null,

  setOnline: (isOnline) => set({isOnline}),

  syncNow: async () => {
    const token = await authService.getIdToken()
    if (!token) return

    set({syncStatus: "syncing", lastError: null})
    try {
      const {lastSyncedAt} = get()
      const accountIdBySyncId = new Map<string, number>()
      for (const account of await db.accounts.toArray()) {
        if (account.syncId) accountIdBySyncId.set(account.syncId, account.id!)
      }

      for (const table of SYNCED_TABLES) {
        await pullTable(table, lastSyncedAt, token, accountIdBySyncId)
      }

      const accountSyncIdByLocalId = new Map<number, string>()
      for (const account of await db.accounts.toArray()) {
        if (account.syncId) accountSyncIdByLocalId.set(account.id!, account.syncId)
      }

      for (const table of SYNCED_TABLES) {
        await pushTable(table, lastSyncedAt, token, accountSyncIdByLocalId)
      }

      set({syncStatus: "idle", lastSyncedAt: new Date(), lastError: null})
    } catch (error: unknown) {
      set({syncStatus: "error", lastError: error instanceof Error ? error.message : "Unknown sync error"})
    }
  },
}))

// Kept side-effect-free at module scope (no addEventListener here) so this
// module stays safely importable from tests/SSR; db-context.tsx wires the
// browser's online/offline events and the initial app-load sync.
export type {OfflineSyncState}
