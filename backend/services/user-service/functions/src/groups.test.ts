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
import { handleGroups } from "./groups";

/**
 * A chainable mock of the subset of the supabase-js query builder this
 * module uses. Every chain method (from/select/insert/update/eq/in/is/
 * order) returns the same builder. Three ways a chain resolves:
 *  - `.single()` / `.maybeSingle()` — queued per-call via mockResolvedValueOnce
 *  - a bare `await builder` (no terminal call) — resolves via `.then()`,
 *    also queued via a small FIFO so sequential bare-awaited selects in
 *    one request (e.g. listGroups' multiple queries) can return
 *    different data.
 */
function makeSupabaseMock() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const thenQueue: Array<{ data: unknown; error: unknown }> = [];
  const defaultThenResult = { data: [] as unknown[], error: null as unknown };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {};
  const chain = (method: string) =>
    jest.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    });

  builder.from = chain("from");
  builder.select = chain("select");
  builder.insert = chain("insert");
  builder.update = chain("update");
  builder.eq = chain("eq");
  builder.in = chain("in");
  builder.is = chain("is");
  builder.order = chain("order");
  builder.single = jest.fn();
  builder.maybeSingle = jest.fn();
  builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
    const next = thenQueue.length > 0 ? thenQueue.shift()! : defaultThenResult;
    return Promise.resolve(next).then(resolve, reject);
  };

  return {
    builder,
    calls,
    thenQueue,
    queueThen: (result: { data: unknown; error: unknown }) => thenQueue.push(result),
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

describe("handleGroups", () => {
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
    // First maybeSingle() of every request is always the users lookup
    // inside getAuthenticatedUserId, resolving to caller id 7, unless a
    // test overrides it with its own sequence below.
    supa.builder.maybeSingle.mockResolvedValue({ data: { id: 7 }, error: null });
  });

  it("rejects a request with no Authorization header", async () => {
    const req = mockReq({ headers: {} } as unknown as Request);
    const res = mockRes();

    await handleGroups(req, res, []);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  describe("POST /groups (create)", () => {
    it("makes the creator an owner with memberCount 1", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }); // auth lookup
      supa.builder.single.mockResolvedValueOnce({
        data: { id: "g1", name: "Trip", created_by: 7, created_at: "2026-11-01T00:00:00.000Z" },
        error: null,
      });
      supa.queueThen({ data: null, error: null }); // membership insert (bare await)

      const req = mockReq({ method: "POST", body: { name: "Trip" } });
      const res = mockRes();

      await handleGroups(req, res, []);

      expect(supa.builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ group_id: "g1", user_id: 7, role: "owner" })
      );
      expect(res.jsonBody).toEqual({
        group: { id: "g1", name: "Trip", createdBy: 7, createdAt: "2026-11-01T00:00:00.000Z", memberCount: 1 },
      });
    });

    it("rejects a blank group name", async () => {
      const req = mockReq({ method: "POST", body: { name: "  " } });
      const res = mockRes();

      await handleGroups(req, res, []);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("GET /groups (list)", () => {
    it("only returns groups the caller is an active member of", async () => {
      supa.queueThen({ data: [{ group_id: "g1" }], error: null }); // memberships for caller
      supa.queueThen({
        data: [{ id: "g1", name: "Trip", created_by: 7, created_at: "2026-11-01T00:00:00.000Z" }],
        error: null,
      }); // groups
      supa.queueThen({ data: [{ group_id: "g1" }, { group_id: "g1" }], error: null }); // all active members, for counts

      const req = mockReq({ method: "GET", body: {} });
      const res = mockRes();

      await handleGroups(req, res, []);

      expect(res.jsonBody).toEqual({
        groups: [{ id: "g1", name: "Trip", createdBy: 7, createdAt: "2026-11-01T00:00:00.000Z", memberCount: 2 }],
      });
    });

    it("returns an empty list when the caller has no active memberships", async () => {
      supa.queueThen({ data: [], error: null }); // memberships for caller

      const req = mockReq({ method: "GET", body: {} });
      const res = mockRes();

      await handleGroups(req, res, []);

      expect(res.jsonBody).toEqual({ groups: [] });
    });
  });

  describe("GET /groups/:groupId (detail)", () => {
    it("403s when a non-member tries to read group detail", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: null, error: null }); // membership lookup: not a member

      const req = mockReq({ method: "GET" });
      const res = mockRes();

      await handleGroups(req, res, ["g1"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns group + members for an active member", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "owner" }, error: null }) // membership check
        .mockResolvedValueOnce({
          data: { id: "g1", name: "Trip", created_by: 7, created_at: "2026-11-01T00:00:00.000Z", deleted_at: null },
          error: null,
        }); // group row
      supa.queueThen({ data: [{ user_id: 7, role: "owner", joined_at: "2026-11-01T00:00:00.000Z" }], error: null }); // members
      supa.queueThen({ data: [{ id: 7, name: "Alice", email: "alice@example.com" }], error: null }); // users

      const req = mockReq({ method: "GET" });
      const res = mockRes();

      await handleGroups(req, res, ["g1"]);

      expect(res.jsonBody).toEqual({
        group: { id: "g1", name: "Trip", createdBy: 7, createdAt: "2026-11-01T00:00:00.000Z", memberCount: 1 },
        members: [{ userId: 7, name: "Alice", email: "alice@example.com", role: "owner", joinedAt: "2026-11-01T00:00:00.000Z" }],
      });
    });
  });

  describe("POST /groups/:groupId/members (add member)", () => {
    it("only allows the owner to add members (403 for a regular member)", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "member" }, error: null }); // membership check: not owner

      const req = mockReq({ method: "POST", body: { email: "bob@example.com" } });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "members"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("404s with the right message when no account matches the email", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "owner" }, error: null }) // membership check
        .mockResolvedValueOnce({ data: null, error: null }); // user-by-email lookup

      const req = mockReq({ method: "POST", body: { email: "nobody@example.com" } });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "members"]);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.jsonBody).toEqual({ error: "No account found with that email" });
    });

    it("409s when the target user is already an active member", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "owner" }, error: null }) // membership check
        .mockResolvedValueOnce({ data: { id: 8, name: "Bob", email: "bob@example.com" }, error: null }) // user-by-email
        .mockResolvedValueOnce({ data: { id: "m1", removed_at: null }, error: null }); // existing active membership

      const req = mockReq({ method: "POST", body: { email: "bob@example.com" } });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "members"]);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.jsonBody).toEqual({ error: "Already a member" });
    });

    it("adds a new member on success", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "owner" }, error: null }) // membership check
        .mockResolvedValueOnce({ data: { id: 8, name: "Bob", email: "bob@example.com" }, error: null }) // user-by-email
        .mockResolvedValueOnce({ data: null, error: null }); // no existing membership row
      supa.queueThen({ data: null, error: null }); // insert

      const req = mockReq({ method: "POST", body: { email: "bob@example.com" } });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "members"]);

      expect(res.status).not.toHaveBeenCalledWith(409);
      expect(res.status).not.toHaveBeenCalledWith(404);
      const body = res.jsonBody as { member: { userId: number; role: string } };
      expect(body.member.userId).toBe(8);
      expect(body.member.role).toBe("member");
    });
  });

  describe("DELETE /groups/:groupId/members/:userId (remove/leave)", () => {
    it("allows a member to remove themselves (self-leave) even though they're not the owner", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup -> caller id 7
        .mockResolvedValueOnce({ data: { role: "member" }, error: null }) // caller's own membership (not owner)
        .mockResolvedValueOnce({ data: { id: "m1", removed_at: null }, error: null }); // target membership row (self)
      supa.queueThen({ data: null, error: null }); // update

      const req = mockReq({ method: "DELETE" });
      const res = mockRes();

      // caller (7) removing themselves (7)
      await handleGroups(req, res, ["g1", "members", "7"]);

      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(res.jsonBody).toEqual({ success: true });
    });

    it("403s when a non-owner tries to remove someone else", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup -> caller id 7
        .mockResolvedValueOnce({ data: { role: "member" }, error: null }); // caller's own membership (not owner)

      const req = mockReq({ method: "DELETE" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "members", "8"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("POST /groups/:groupId/expenses (add expense, splitting)", () => {
    it("splits a 1000-cent expense 3 ways without losing or gaining a cent", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: { role: "owner" }, error: null }); // membership check
      supa.queueThen({
        data: [
          { user_id: 5, role: "member", joined_at: "2026-11-01T00:00:00.000Z" },
          { user_id: 7, role: "owner", joined_at: "2026-11-01T00:00:00.000Z" },
          { user_id: 9, role: "member", joined_at: "2026-11-01T00:00:00.000Z" },
        ],
        error: null,
      }); // active members
      supa.builder.single.mockResolvedValueOnce({
        data: {
          id: "e1",
          group_id: "g1",
          paid_by: 7,
          amount: 1000,
          description: "Dinner",
          category: null,
          date: "2026-11-10T00:00:00.000Z",
        },
        error: null,
      }); // expense insert
      supa.queueThen({ data: null, error: null }); // shares insert

      const req = mockReq({
        method: "POST",
        body: { description: "Dinner", amount: 1000, date: "2026-11-10T00:00:00.000Z" },
      });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses"]);

      const body = res.jsonBody as { expense: { shares: Array<{ userId: number; shareAmount: number }> } };
      const shares = body.expense.shares;
      const total = shares.reduce((sum, s) => sum + s.shareAmount, 0);
      expect(total).toBe(1000);
      // 1000 / 3 = 333 base, remainder 1 -> lowest user id (5) gets the extra cent
      expect(shares.find((s) => s.userId === 5)?.shareAmount).toBe(334);
      expect(shares.find((s) => s.userId === 7)?.shareAmount).toBe(333);
      expect(shares.find((s) => s.userId === 9)?.shareAmount).toBe(333);
    });

    it("403s when a non-member tries to add an expense", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup
        .mockResolvedValueOnce({ data: null, error: null }); // not a member

      const req = mockReq({
        method: "POST",
        body: { description: "Dinner", amount: 1000, date: "2026-11-10T00:00:00.000Z" },
      });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("GET /groups/:groupId/expenses (list)", () => {
    it("403s when a non-member tries to list expenses", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const req = mockReq({ method: "GET" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("GET /groups/:groupId/balances", () => {
    it("403s when a non-member requests balances", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const req = mockReq({ method: "GET" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "balances"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("reflects unsettled shares correctly: payer is owed, others owe", async () => {
      supa.builder.maybeSingle.mockResolvedValueOnce({ data: { id: 7 }, error: null }); // auth lookup
      supa.builder.maybeSingle.mockResolvedValueOnce({ data: { role: "owner" }, error: null }); // membership check
      supa.queueThen({
        data: [
          { user_id: 7, role: "owner", joined_at: "2026-11-01T00:00:00.000Z" },
          { user_id: 8, role: "member", joined_at: "2026-11-01T00:00:00.000Z" },
        ],
        error: null,
      }); // active members
      supa.queueThen({ data: [{ id: "e1", paid_by: 7 }], error: null }); // expenses in group
      supa.queueThen({
        data: [
          { group_expense_id: "e1", user_id: 7, share_amount: 500 },
          { group_expense_id: "e1", user_id: 8, share_amount: 500 },
        ],
        error: null,
      }); // unsettled shares
      supa.queueThen({
        data: [
          { id: 7, name: "Alice", email: "alice@example.com" },
          { id: 8, name: "Bob", email: "bob@example.com" },
        ],
        error: null,
      }); // users

      const req = mockReq({ method: "GET" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "balances"]);

      expect(res.jsonBody).toEqual({
        balances: [
          { userId: 7, name: "Alice", netBalance: 500 },
          { userId: 8, name: "Bob", netBalance: -500 },
        ],
      });
    });
  });

  describe("POST .../shares/:userId/settle", () => {
    it("allows the payer or the ower to settle, not an unrelated member", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 9 }, error: null }) // auth lookup -> caller id 9 (unrelated)
        .mockResolvedValueOnce({ data: { id: "e1", group_id: "g1", paid_by: 7 }, error: null }); // expense lookup

      const req = mockReq({ method: "POST" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses", "e1", "shares", "8", "settle"]);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("settling a share changes it to settled when called by the ower", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 8 }, error: null }) // auth lookup -> caller id 8 (the ower)
        .mockResolvedValueOnce({ data: { id: "e1", group_id: "g1", paid_by: 7 }, error: null }) // expense lookup
        .mockResolvedValueOnce({ data: { id: "s1" }, error: null }); // share lookup
      supa.queueThen({ data: null, error: null }); // update

      const req = mockReq({ method: "POST" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses", "e1", "shares", "8", "settle"]);

      expect(supa.builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_settled: true })
      );
      expect(res.jsonBody).toEqual({ success: true });
    });

    it("404s when the share doesn't exist", async () => {
      supa.builder.maybeSingle
        .mockResolvedValueOnce({ data: { id: 7 }, error: null }) // auth lookup -> caller is the payer
        .mockResolvedValueOnce({ data: { id: "e1", group_id: "g1", paid_by: 7 }, error: null }) // expense lookup
        .mockResolvedValueOnce({ data: null, error: null }); // no such share

      const req = mockReq({ method: "POST" });
      const res = mockRes();

      await handleGroups(req, res, ["g1", "expenses", "e1", "shares", "8", "settle"]);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
