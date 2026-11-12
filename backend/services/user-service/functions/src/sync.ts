import * as admin from "firebase-admin";
import {Request, Response} from "firebase-functions/v1";
import {getSupabaseClient} from "./supabase-client";

/**
 * Maps a client-side Dexie table name to its Postgres table and the
 * camelCase<->snake_case field pairs to translate on the way in/out. Every
 * table always also carries syncId<->sync_id, createdAt<->created_at,
 * updatedAt<->updated_at, deletedAt<->deleted_at (handled separately below,
 * not repeated per table here).
 */
const TABLES: Record<string, {pgTable: string; fields: Array<[string, string]>}> = {
  transactions: {
    pgTable: "user_transactions",
    fields: [
      ["accountSyncId", "account_sync_id"],
      ["amount", "amount"],
      ["type", "type"],
      ["category", "category"],
      ["description", "description"],
      ["date", "date"],
      ["transferId", "transfer_id"],
      ["tags", "tags"],
    ],
  },
  accounts: {
    pgTable: "user_accounts",
    fields: [
      ["name", "name"],
      ["type", "type"],
      ["openingBalance", "opening_balance"],
      ["isDefault", "is_default"],
      ["targetAmount", "target_amount"],
      ["targetDate", "target_date"],
    ],
  },
  categories: {
    pgTable: "user_categories",
    fields: [
      ["name", "name"],
      ["icon", "icon"],
      ["color", "color"],
      ["isDefault", "is_default"],
      ["type", "type"],
    ],
  },
  budgets: {
    pgTable: "user_budgets",
    fields: [
      ["category", "category"],
      ["amount", "amount"],
    ],
  },
  recurringTransactions: {
    pgTable: "user_recurring_transactions",
    fields: [
      ["accountSyncId", "account_sync_id"],
      ["type", "type"],
      ["category", "category"],
      ["description", "description"],
      ["amount", "amount"],
      ["frequency", "frequency"],
      ["startDate", "start_date"],
      ["nextRunDate", "next_run_date"],
      ["isActive", "is_active"],
    ],
  },
};

const COMMON_FIELDS: Array<[string, string]> = [
  ["syncId", "sync_id"],
  ["createdAt", "created_at"],
  ["updatedAt", "updated_at"],
  ["deletedAt", "deleted_at"],
];

interface SyncRecord {
  syncId: string;
  updatedAt: string;
  createdAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

function toRow(record: SyncRecord, userId: number, fields: Array<[string, string]>): Record<string, unknown> {
  const row: Record<string, unknown> = {user_id: userId};
  for (const [clientKey, dbKey] of [...COMMON_FIELDS, ...fields]) {
    if (record[clientKey] !== undefined) row[dbKey] = record[clientKey];
  }
  return row;
}

function fromRow(row: Record<string, unknown>, fields: Array<[string, string]>): SyncRecord {
  const record: Record<string, unknown> = {};
  for (const [clientKey, dbKey] of [...COMMON_FIELDS, ...fields]) {
    record[clientKey] = row[dbKey] ?? null;
  }
  return record as unknown as SyncRecord;
}

export async function getAuthenticatedUserId(req: Request): Promise<number | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(token);

  const {data: dbUser, error} = await getSupabaseClient()
    .from("users")
    .select("id")
    .eq("firebase_id", decodedToken.uid)
    .maybeSingle();

  if (error || !dbUser) return null;
  return Number((dbUser as {id: number}).id);
}

/**
 * Supabase/PostgREST chunk size for both the bulk existence check and the
 * bulk upsert below — keeps each request's `IN (...)` clause and payload
 * bounded regardless of how many records a client pushes in one call.
 */
const PUSH_CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Pushes local changes up. Last-write-wins: a record is only applied if no
 * row exists yet for its syncId, or the incoming updatedAt is strictly
 * newer than what's stored.
 *
 * Bulk, not per-record: the original implementation did one SELECT + one
 * conditional UPSERT per record, sequentially — fine for a handful of
 * rows, but ~7,000 sequential round trips for a ~3,500-row push (a real
 * bulk-import scenario), which hung well past any request timeout and
 * never completed. This instead does one bulk `SELECT ... WHERE sync_id
 * IN (...)` to learn what already exists, then one bulk `UPSERT` of
 * whatever needs writing — each chunked at PUSH_CHUNK_SIZE so an
 * arbitrarily large push still only takes a small, bounded number of
 * round trips (chunks, not records). This is still a read-then-write
 * (not a single atomic SQL statement), so there's a narrow race window
 * between two concurrent syncs for the same user/record — acceptable for
 * a single-user app where the loser of that race is retried, lossless,
 * on the next sync pass.
 */
export async function handleSyncPush(req: Request, res: Response) {
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const userId = await getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({error: "No valid authorization header"});
      return;
    }

    const {table, records} = req.body as {table?: string; records?: SyncRecord[]};
    const tableConfig = table ? TABLES[table] : undefined;
    if (!tableConfig) {
      res.status(400).json({error: "Unknown or missing table"});
      return;
    }

    const allRecords = records ?? [];
    if (allRecords.length === 0) {
      res.json({pushed: 0, skipped: 0});
      return;
    }

    const existingUpdatedAtBySyncId = new Map<string, string>();
    for (const idsChunk of chunk(allRecords.map((r) => r.syncId), PUSH_CHUNK_SIZE)) {
      const {data, error} = await getSupabaseClient()
        .from(tableConfig.pgTable)
        .select("sync_id, updated_at")
        .in("sync_id", idsChunk);

      if (error) throw error;
      for (const row of (data as Array<{sync_id: string; updated_at: string}>) ?? []) {
        existingUpdatedAtBySyncId.set(row.sync_id, row.updated_at);
      }
    }

    let skipped = 0;
    const rowsToUpsert: Record<string, unknown>[] = [];
    for (const record of allRecords) {
      const existingUpdatedAt = existingUpdatedAtBySyncId.get(record.syncId);
      if (existingUpdatedAt && new Date(existingUpdatedAt) >= new Date(record.updatedAt)) {
        skipped += 1;
        continue;
      }
      rowsToUpsert.push(toRow(record, userId, tableConfig.fields));
    }

    let pushed = 0;
    for (const rowsChunk of chunk(rowsToUpsert, PUSH_CHUNK_SIZE)) {
      const {error} = await getSupabaseClient()
        .from(tableConfig.pgTable)
        .upsert(rowsChunk, {onConflict: "sync_id"});

      if (error) throw error;
      pushed += rowsChunk.length;
    }

    res.json({pushed, skipped});
  } catch (error: unknown) {
    res.status(500).json({
      error: "Sync push failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/** Pulls every change (including soft-deleted rows, as tombstones) since the given timestamp. */
export async function handleSyncPull(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const userId = await getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({error: "No valid authorization header"});
      return;
    }

    const table = req.query.table as string | undefined;
    const since = req.query.since as string | undefined;
    const tableConfig = table ? TABLES[table] : undefined;
    if (!tableConfig || !since) {
      res.status(400).json({error: "Unknown or missing table, or missing since"});
      return;
    }

    const {data: rows, error} = await getSupabaseClient()
      .from(tableConfig.pgTable)
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", since)
      .order("updated_at", {ascending: true});

    if (error) throw error;

    const records = ((rows as Record<string, unknown>[]) ?? []).map((row) => fromRow(row, tableConfig.fields));
    res.json({records});
  } catch (error: unknown) {
    res.status(500).json({
      error: "Sync pull failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
