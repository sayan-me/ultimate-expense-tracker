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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  builder.from = jest.fn((table: string) => {
    state.table = table;
    return builder;
  });
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.gt = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(() => Promise.resolve(maybeSingleResult));
  builder.upsert = jest.fn(() => Promise.resolve(upsertResult));
  // select(...) resolves the "many rows" query when awaited directly (pull path)
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(selectManyResult).then(resolve);

  return { builder, state, maybeSingleResult, upsertResult, selectManyResult };
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
      let call = 0;
      supa.builder.maybeSingle = jest.fn(() => {
        call += 1;
        // First maybeSingle() is the users lookup, second is the existing-row lookup.
        return Promise.resolve(call === 1 ? { data: { id: 7 }, error: null } : { data: null, error: null });
      });
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
      let call = 0;
      supa.builder.maybeSingle = jest.fn(() => {
        call += 1;
        return Promise.resolve(
          call === 1
            ? { data: { id: 7 }, error: null }
            : { data: { updated_at: "2026-11-01T00:00:00.000Z" }, error: null }
        );
      });
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
      let call = 0;
      supa.builder.maybeSingle = jest.fn(() => {
        call += 1;
        return Promise.resolve(
          call === 1
            ? { data: { id: 7 }, error: null }
            : { data: { updated_at: "2026-11-05T00:00:00.000Z" }, error: null }
        );
      });
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
  });
});
