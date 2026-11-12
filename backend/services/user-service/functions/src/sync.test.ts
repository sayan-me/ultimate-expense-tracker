import type { Request, Response } from "firebase-functions/v1";

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import * as admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import { __resetSupabaseClientForTests } from "./supabase-client";
import { handleSyncPush, handleSyncPull } from "./sync";

/** A minimal chainable mock of the subset of the supabase-js query builder this code uses. */
function makeSupabaseMock() {
  const state: { table?: string } = {};
  const maybeSingleResult = { data: null as unknown, error: null as unknown };
  const upsertResult = { data: null as unknown, error: null as unknown };
  const selectManyResult = { data: [] as unknown[], error: null as unknown };
  // FIFO for tests that need successive "many rows" resolutions to differ
  // (e.g. pull's paginated .range() calls) — falls back to selectManyResult
  // once (or if) the queue is empty, so existing single-page tests that
  // only ever set selectManyResult.data once don't need to change.
  const selectManyQueue: Array<{ data: unknown; error: unknown }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  builder.from = jest.fn((table: string) => {
    state.table = table;
    return builder;
  });
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.gt = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.range = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(maybeSingleResult));
  builder.upsert = jest.fn(() => Promise.resolve(upsertResult));
  // select(...) resolves the "many rows" query when awaited directly — used
  // both by the pull path and by push's bulk existing-rows lookup.
  builder.then = (resolve: (v: unknown) => unknown) => {
    const next = selectManyQueue.length > 0 ? selectManyQueue.shift()! : selectManyResult;
    return Promise.resolve(next).then(resolve);
  };

  return {
    builder,
    state,
    maybeSingleResult,
    upsertResult,
    selectManyResult,
    queueSelectMany: (result: { data: unknown; error: unknown }) => selectManyQueue.push(result),
  };
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: "POST",
    headers: { authorization: "Bearer valid-token" },
    body: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes() {
  const res: Partial<Response> & { statusCode?: number; jsonBody?: unknown } = {};
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn((body: unknown) => {
    res.jsonBody = body;
    return res as Response;
  });
  return res as Response & { statusCode?: number; jsonBody?: unknown };
}

describe("sync endpoints", () => {
  let supa: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    __resetSupabaseClientForTests();
    supa = makeSupabaseMock();
    (createClient as jest.Mock).mockReturnValue(supa.builder);
    (admin.auth as jest.Mock).mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: "firebase-uid-123" }),
    });
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  describe("handleSyncPush", () => {
    it("rejects a request with no Authorization header", async () => {
      const req = mockReq({ headers: {} } as unknown as Request);
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects an unknown table name", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      const req = mockReq({ body: { table: "not_a_real_table", records: [] } });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("looks up the Supabase user by the verified Firebase uid, not a client-supplied id", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      const req = mockReq({
        body: {
          table: "budgets",
          records: [{ syncId: "b1", category: null, amount: 50000, updatedAt: "2026-11-01T00:00:00.000Z" }],
        },
      });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(supa.builder.from).toHaveBeenCalledWith("users");
      expect(supa.builder.eq).toHaveBeenCalledWith("firebase_id", "firebase-uid-123");
    });

    it("applies a record when no existing row exists yet", async () => {
      supa.maybeSingleResult.data = { id: 7 }; // users lookup
      supa.selectManyResult.data = []; // bulk existing-rows lookup: nothing found
      const req = mockReq({
        body: {
          table: "budgets",
          records: [{ syncId: "b1", category: null, amount: 50000, updatedAt: "2026-11-01T00:00:00.000Z" }],
        },
      });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(supa.builder.upsert).toHaveBeenCalled();
      expect(res.jsonBody).toMatchObject({ pushed: 1, skipped: 0 });
    });

    it("applies a record whose updatedAt is newer than the stored row", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      supa.selectManyResult.data = [{ sync_id: "b1", updated_at: "2026-11-01T00:00:00.000Z" }];
      const req = mockReq({
        body: {
          table: "budgets",
          records: [{ syncId: "b1", category: null, amount: 60000, updatedAt: "2026-11-02T00:00:00.000Z" }],
        },
      });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(supa.builder.upsert).toHaveBeenCalled();
      expect(res.jsonBody).toMatchObject({ pushed: 1, skipped: 0 });
    });

    it("skips (does not upsert) a record whose updatedAt is not newer than the stored row", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      supa.selectManyResult.data = [{ sync_id: "b1", updated_at: "2026-11-05T00:00:00.000Z" }];
      const req = mockReq({
        body: {
          table: "budgets",
          records: [{ syncId: "b1", category: null, amount: 1, updatedAt: "2026-11-01T00:00:00.000Z" }],
        },
      });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(supa.builder.upsert).not.toHaveBeenCalled();
      expect(res.jsonBody).toMatchObject({ pushed: 0, skipped: 1 });
    });

    it("does nothing (no bulk lookup, no upsert) when records is empty", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      const req = mockReq({ body: { table: "budgets", records: [] } });
      const res = mockRes();

      await handleSyncPush(req, res);

      expect(supa.builder.in).not.toHaveBeenCalled();
      expect(supa.builder.upsert).not.toHaveBeenCalled();
      expect(res.jsonBody).toMatchObject({ pushed: 0, skipped: 0 });
    });

    // Reported in live multi-device use: pushing ~3,500 real transactions
    // hung indefinitely and eventually errored out, because the original
    // implementation did one SELECT + one conditional UPSERT per record,
    // sequentially, inside a single request — ~7,000 round trips for that
    // push. These two tests pin down the fix: existence checks and writes
    // happen as bulk calls, not one call per record.
    it("checks existing rows and writes new ones as single bulk calls, not one call per record", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      supa.selectManyResult.data = []; // none of these three exist yet
      const req = mockReq({
        body: {
          table: "budgets",
          records: [
            { syncId: "b1", category: "Food", amount: 1000, updatedAt: "2026-11-01T00:00:00.000Z" },
            { syncId: "b2", category: "Transport", amount: 2000, updatedAt: "2026-11-01T00:00:00.000Z" },
            { syncId: "b3", category: "Rent", amount: 3000, updatedAt: "2026-11-01T00:00:00.000Z" },
          ],
        },
      });
      const res = mockRes();

      await handleSyncPush(req, res);

      // One bulk existence check covering all three syncIds...
      expect(supa.builder.in).toHaveBeenCalledTimes(1);
      expect(supa.builder.in).toHaveBeenCalledWith("sync_id", ["b1", "b2", "b3"]);
      // ...and one bulk upsert of all three rows, not three separate calls.
      expect(supa.builder.upsert).toHaveBeenCalledTimes(1);
      const upsertedRows = (supa.builder.upsert as jest.Mock).mock.calls[0][0] as unknown[];
      expect(upsertedRows).toHaveLength(3);
      expect(res.jsonBody).toMatchObject({ pushed: 3, skipped: 0 });
    });

    it("splits a very large batch into multiple chunked bulk calls instead of one unbounded call", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      supa.selectManyResult.data = [];
      const records = Array.from({ length: 501 }, (_, i) => ({
        syncId: `b${i}`,
        category: "Food",
        amount: 100,
        updatedAt: "2026-11-01T00:00:00.000Z",
      }));
      const req = mockReq({ body: { table: "budgets", records } });
      const res = mockRes();

      await handleSyncPush(req, res);

      // 501 records in chunks of (at most) 500 must take at least 2 calls
      // of each kind — proves chunking actually happens, not just that a
      // single giant array is handed to Supabase in one call regardless.
      expect((supa.builder.in as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
      expect((supa.builder.upsert as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(res.jsonBody).toMatchObject({ pushed: 501, skipped: 0 });
    });
  });

  describe("handleSyncPull", () => {
    it("rejects a request with no Authorization header", async () => {
      const req = mockReq({ method: "GET", headers: {} } as unknown as Request);
      const res = mockRes();

      await handleSyncPull(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects an unknown table name", async () => {
      supa.maybeSingleResult.data = { id: 7 };
      const req = mockReq({ method: "GET", query: { table: "nope", since: "2026-01-01T00:00:00.000Z" } });
      const res = mockRes();

      await handleSyncPull(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("queries rows scoped to the authenticated user's id and the since timestamp", async () => {
      supa.builder.maybeSingle = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
      supa.selectManyResult.data = [];
      const req = mockReq({ method: "GET", query: { table: "budgets", since: "2026-01-01T00:00:00.000Z" } });
      const res = mockRes();

      await handleSyncPull(req, res);

      expect(supa.builder.from).toHaveBeenCalledWith("user_budgets");
      expect(supa.builder.eq).toHaveBeenCalledWith("user_id", 7);
      expect(supa.builder.gt).toHaveBeenCalledWith("updated_at", "2026-01-01T00:00:00.000Z");
      expect(res.jsonBody).toMatchObject({ records: [] });
    });

    it("maps returned rows back into the client's camelCase field shape", async () => {
      supa.builder.maybeSingle = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
      supa.selectManyResult.data = [
        {
          sync_id: "b1",
          category: "Food",
          amount: 5000,
          created_at: "2026-11-01T00:00:00.000Z",
          updated_at: "2026-11-02T00:00:00.000Z",
          deleted_at: null,
        },
      ];
      const req = mockReq({ method: "GET", query: { table: "budgets", since: "2026-01-01T00:00:00.000Z" } });
      const res = mockRes();

      await handleSyncPull(req, res);

      expect(res.jsonBody).toMatchObject({
        records: [
          {
            syncId: "b1",
            category: "Food",
            amount: 5000,
            createdAt: "2026-11-01T00:00:00.000Z",
            updatedAt: "2026-11-02T00:00:00.000Z",
            deletedAt: null,
          },
        ],
      });
    });

    // Found live: the Supabase project's PostgREST max_rows is 1000
    // (backend/db/supabase/config.toml), and this query had no .range()
    // at all — a user with more than 1000 changed rows silently got only
    // the oldest 1000 back, with no error and no indication anything was
    // missing. Worse, the client then advances its own sync checkpoint
    // past those returned rows, so the remaining rows — being older than
    // the new checkpoint — are never fetched on any future incremental
    // pull either. This pins down the fix: page through with .range()
    // until a page comes back short, accumulating every row.
    it("pages through .range() until a short page signals the end, accumulating every row", async () => {
      supa.builder.maybeSingle = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
      const fullPage = Array.from({ length: 500 }, (_, i) => ({
        sync_id: `b${i}`,
        category: "Food",
        amount: 100,
        created_at: "2026-11-01T00:00:00.000Z",
        updated_at: "2026-11-01T00:00:00.000Z",
        deleted_at: null,
      }));
      const shortPage = [
        {
          sync_id: "b-last",
          category: "Rent",
          amount: 200,
          created_at: "2026-11-02T00:00:00.000Z",
          updated_at: "2026-11-02T00:00:00.000Z",
          deleted_at: null,
        },
      ];
      supa.queueSelectMany({ data: fullPage, error: null });
      supa.queueSelectMany({ data: shortPage, error: null });

      const req = mockReq({ method: "GET", query: { table: "budgets", since: "2026-01-01T00:00:00.000Z" } });
      const res = mockRes();

      await handleSyncPull(req, res);

      // A full-size first page means there might be more — a second
      // .range() call must happen. The short second page means it stops
      // there (not a third, unbounded call).
      expect((supa.builder.range as jest.Mock).mock.calls.length).toBe(2);
      const body = res.jsonBody as { records: Array<{ syncId: string }> };
      expect(body.records).toHaveLength(501);
      expect(body.records.map((r) => r.syncId)).toContain("b-last");
    });

    it("does a single page when the first page already comes back short", async () => {
      supa.builder.maybeSingle = jest.fn(() => Promise.resolve({ data: { id: 7 }, error: null }));
      supa.selectManyResult.data = [
        { sync_id: "b1", category: "Food", amount: 100, created_at: "2026-11-01T00:00:00.000Z", updated_at: "2026-11-01T00:00:00.000Z", deleted_at: null },
      ];
      const req = mockReq({ method: "GET", query: { table: "budgets", since: "2026-01-01T00:00:00.000Z" } });
      const res = mockRes();

      await handleSyncPull(req, res);

      expect((supa.builder.range as jest.Mock).mock.calls.length).toBe(1);
      expect((res.jsonBody as { records: unknown[] }).records).toHaveLength(1);
    });
  });
});
