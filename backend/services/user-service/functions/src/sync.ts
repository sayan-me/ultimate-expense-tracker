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

async function getAuthenticatedUserId(req: Request): Promise<number | null> {
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
 * Pushes local changes up. Last-write-wins: a record is only applied if no
 * row exists yet for its syncId, or the incoming updatedAt is strictly
 * newer than what's stored. This is a read-then-write (not a single atomic
 * SQL statement), so there's a narrow race window between two concurrent
 * syncs for the same user/record — acceptable for a single-user app where
 * the loser of that race is retried, lossless, on the next sync pass.
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

    let pushed = 0;
    let skipped = 0;

    for (const record of records ?? []) {
      const {data: existing, error: existingError} = await getSupabaseClient()
        .from(tableConfig.pgTable)
        .select("updated_at")
        .eq("sync_id", record.syncId)
        .maybeSingle();

      if (existingError) throw existingError;

      const existingUpdatedAt = (existing as {updated_at?: string} | null)?.updated_at;
      if (existingUpdatedAt && new Date(existingUpdatedAt) >= new Date(record.updatedAt)) {
        skipped += 1;
        continue;
      }

      const row = toRow(record, userId, tableConfig.fields);
      const {error: upsertError} = await getSupabaseClient()
        .from(tableConfig.pgTable)
        .upsert(row, {onConflict: "sync_id"});

      if (upsertError) throw upsertError;
      pushed += 1;
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
