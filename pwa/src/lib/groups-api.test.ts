import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { authService } from "@/services/auth.service"
import {
  createGroup,
  listGroups,
  getGroup,
  addGroupMember,
  removeGroupMember,
  addGroupExpense,
  listGroupExpenses,
  getGroupBalances,
  settleGroupShare,
} from "./groups-api"

vi.mock("@/services/auth.service", () => ({
  authService: { getIdToken: vi.fn() },
}))

vi.mock("@/config/env", () => ({
  env: { api: { userServiceUrl: "https://example-user-service.test" } },
}))

const BASE = "https://example-user-service.test/groups"

function okResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response
}

function errorResponse(body: unknown) {
  return { ok: false, json: async () => body } as Response
}

describe("groups-api", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue("fake-id-token")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  describe("createGroup", () => {
    it("POSTs the name and returns the group", async () => {
      const group = { id: "g1", name: "Trip", createdBy: 1, createdAt: "2026-01-01T00:00:00.000Z", memberCount: 1 }
      fetchMock.mockResolvedValueOnce(okResponse({ group }))

      const result = await createGroup("Trip")

      expect(fetchMock).toHaveBeenCalledWith(BASE, {
        method: "POST",
        headers: { Authorization: "Bearer fake-id-token", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Trip" }),
      })
      expect(result).toEqual(group)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(createGroup("Trip")).rejects.toThrow("Not signed in")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("throws the server message on a non-2xx response", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "bad_request", message: "Name is required" }))
      await expect(createGroup("")).rejects.toThrow("Name is required")
    })

    it("falls back to error when message is absent", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "bad_request" }))
      await expect(createGroup("")).rejects.toThrow("bad_request")
    })
  })

  describe("listGroups", () => {
    it("GETs the groups list", async () => {
      const groups = [{ id: "g1", name: "Trip", createdBy: 1, createdAt: "2026-01-01T00:00:00.000Z", memberCount: 2 }]
      fetchMock.mockResolvedValueOnce(okResponse({ groups }))

      const result = await listGroups()

      expect(fetchMock).toHaveBeenCalledWith(BASE, {
        method: "GET",
        headers: { Authorization: "Bearer fake-id-token" },
      })
      expect(result).toEqual(groups)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(listGroups()).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ message: "Unauthorized" }))
      await expect(listGroups()).rejects.toThrow("Unauthorized")
    })
  })

  describe("getGroup", () => {
    it("GETs the group detail", async () => {
      const group = { id: "g1", name: "Trip", createdBy: 1, createdAt: "2026-01-01T00:00:00.000Z", memberCount: 2 }
      const members = [{ userId: 1, name: "Alice", email: "a@test.com", role: "owner" as const, joinedAt: "2026-01-01T00:00:00.000Z" }]
      fetchMock.mockResolvedValueOnce(okResponse({ group, members }))

      const result = await getGroup("g1")

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1`, {
        method: "GET",
        headers: { Authorization: "Bearer fake-id-token" },
      })
      expect(result).toEqual({ group, members })
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(getGroup("g1")).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "not_found" }))
      await expect(getGroup("g1")).rejects.toThrow("not_found")
    })
  })

  describe("addGroupMember", () => {
    it("POSTs the email and returns the member", async () => {
      const member = { userId: 2, name: "Bob", email: "bob@test.com", role: "member" as const, joinedAt: "2026-01-02T00:00:00.000Z" }
      fetchMock.mockResolvedValueOnce(okResponse({ member }))

      const result = await addGroupMember("g1", "bob@test.com")

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/members`, {
        method: "POST",
        headers: { Authorization: "Bearer fake-id-token", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bob@test.com" }),
      })
      expect(result).toEqual(member)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(addGroupMember("g1", "bob@test.com")).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ message: "Already a member" }))
      await expect(addGroupMember("g1", "bob@test.com")).rejects.toThrow("Already a member")
    })
  })

  describe("removeGroupMember", () => {
    it("DELETEs the member", async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ success: true }))

      await removeGroupMember("g1", 2)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/members/2`, {
        method: "DELETE",
        headers: { Authorization: "Bearer fake-id-token" },
      })
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(removeGroupMember("g1", 2)).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "cannot_remove_owner" }))
      await expect(removeGroupMember("g1", 2)).rejects.toThrow("cannot_remove_owner")
    })
  })

  describe("addGroupExpense", () => {
    it("POSTs the expense data and returns the expense", async () => {
      const expense = {
        id: "e1",
        groupId: "g1",
        paidBy: 1,
        amount: 2000,
        description: "Dinner",
        category: "Food",
        date: "2026-01-03T00:00:00.000Z",
        shares: [{ userId: 1, shareAmount: 1000, isSettled: false }, { userId: 2, shareAmount: 1000, isSettled: false }],
      }
      fetchMock.mockResolvedValueOnce(okResponse({ expense }))

      const data = { description: "Dinner", amount: 2000, category: "Food", date: "2026-01-03T00:00:00.000Z" }
      const result = await addGroupExpense("g1", data)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/expenses`, {
        method: "POST",
        headers: { Authorization: "Bearer fake-id-token", "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      expect(result).toEqual(expense)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(
        addGroupExpense("g1", { description: "Dinner", amount: 2000, date: "2026-01-03T00:00:00.000Z" })
      ).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ message: "Invalid amount" }))
      await expect(
        addGroupExpense("g1", { description: "Dinner", amount: -1, date: "2026-01-03T00:00:00.000Z" })
      ).rejects.toThrow("Invalid amount")
    })
  })

  describe("listGroupExpenses", () => {
    it("GETs the expenses list", async () => {
      const expenses = [
        {
          id: "e1",
          groupId: "g1",
          paidBy: 1,
          amount: 2000,
          description: "Dinner",
          category: null,
          date: "2026-01-03T00:00:00.000Z",
          shares: [],
        },
      ]
      fetchMock.mockResolvedValueOnce(okResponse({ expenses }))

      const result = await listGroupExpenses("g1")

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/expenses`, {
        method: "GET",
        headers: { Authorization: "Bearer fake-id-token" },
      })
      expect(result).toEqual(expenses)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(listGroupExpenses("g1")).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "server_error" }))
      await expect(listGroupExpenses("g1")).rejects.toThrow("server_error")
    })
  })

  describe("getGroupBalances", () => {
    it("GETs the balances list", async () => {
      const balances = [{ userId: 1, name: "Alice", netBalance: 1000 }]
      fetchMock.mockResolvedValueOnce(okResponse({ balances }))

      const result = await getGroupBalances("g1")

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/balances`, {
        method: "GET",
        headers: { Authorization: "Bearer fake-id-token" },
      })
      expect(result).toEqual(balances)
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(getGroupBalances("g1")).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ message: "Group not found" }))
      await expect(getGroupBalances("g1")).rejects.toThrow("Group not found")
    })
  })

  describe("settleGroupShare", () => {
    it("POSTs to the settle endpoint with no body", async () => {
      fetchMock.mockResolvedValueOnce(okResponse({ success: true }))

      await settleGroupShare("g1", "e1", 2)

      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/g1/expenses/e1/shares/2/settle`, {
        method: "POST",
        headers: { Authorization: "Bearer fake-id-token" },
      })
    })

    it("throws 'Not signed in' when there is no token", async () => {
      ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(settleGroupShare("g1", "e1", 2)).rejects.toThrow("Not signed in")
    })

    it("throws the server message on failure", async () => {
      fetchMock.mockResolvedValueOnce(errorResponse({ error: "already_settled" }))
      await expect(settleGroupShare("g1", "e1", 2)).rejects.toThrow("already_settled")
    })
  })
})
