import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useGroups, useGroup, useGroupExpenses, useGroupBalances } from "./use-groups"
import * as groupsApi from "@/lib/groups-api"

vi.mock("@/lib/groups-api", () => ({
  createGroup: vi.fn(),
  listGroups: vi.fn(),
  getGroup: vi.fn(),
  addGroupMember: vi.fn(),
  removeGroupMember: vi.fn(),
  addGroupExpense: vi.fn(),
  listGroupExpenses: vi.fn(),
  getGroupBalances: vi.fn(),
  settleGroupShare: vi.fn(),
}))

const mocked = groupsApi as unknown as {
  createGroup: ReturnType<typeof vi.fn>
  listGroups: ReturnType<typeof vi.fn>
  getGroup: ReturnType<typeof vi.fn>
  addGroupMember: ReturnType<typeof vi.fn>
  removeGroupMember: ReturnType<typeof vi.fn>
  addGroupExpense: ReturnType<typeof vi.fn>
  listGroupExpenses: ReturnType<typeof vi.fn>
  getGroupBalances: ReturnType<typeof vi.fn>
  settleGroupShare: ReturnType<typeof vi.fn>
}

const group1 = { id: "g1", name: "Trip", createdBy: 1, createdAt: "2026-01-01T00:00:00.000Z", memberCount: 2 }
const member1 = { userId: 1, name: "Alice", email: "a@test.com", role: "owner" as const, joinedAt: "2026-01-01T00:00:00.000Z" }
const expense1 = {
  id: "e1",
  groupId: "g1",
  paidBy: 1,
  amount: 2000,
  description: "Dinner",
  category: null,
  date: "2026-01-03T00:00:00.000Z",
  shares: [{ userId: 1, shareAmount: 1000, isSettled: false }],
}
const balance1 = { userId: 1, name: "Alice", netBalance: 1000 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useGroups", () => {
  it("fetches groups on mount and populates state", async () => {
    mocked.listGroups.mockResolvedValue([group1])

    const { result } = renderHook(() => useGroups())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.groups).toEqual([group1])
    expect(result.current.error).toBeNull()
    expect(mocked.listGroups).toHaveBeenCalledTimes(1)
  })

  it("sets error when the initial fetch fails", async () => {
    mocked.listGroups.mockRejectedValue(new Error("Network down"))

    const { result } = renderHook(() => useGroups())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe("Network down")
    expect(result.current.groups).toBeUndefined()
  })

  it("createGroup calls the api and refetches on success", async () => {
    mocked.listGroups.mockResolvedValue([])
    mocked.createGroup.mockResolvedValue(group1)

    const { result } = renderHook(() => useGroups())
    await waitFor(() => expect(result.current.loading).toBe(false))

    mocked.listGroups.mockResolvedValue([group1])

    await act(async () => {
      await result.current.createGroup("Trip")
    })

    expect(mocked.createGroup).toHaveBeenCalledWith("Trip")
    expect(mocked.listGroups).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(result.current.groups).toEqual([group1]))
  })

  it("propagates a thrown createGroup error to the caller instead of swallowing it", async () => {
    mocked.listGroups.mockResolvedValue([])
    mocked.createGroup.mockRejectedValue(new Error("Name taken"))

    const { result } = renderHook(() => useGroups())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.createGroup("Trip")).rejects.toThrow("Name taken")
  })
})

describe("useGroup", () => {
  it("fetches group and members on mount", async () => {
    mocked.getGroup.mockResolvedValue({ group: group1, members: [member1] })

    const { result } = renderHook(() => useGroup("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.group).toEqual(group1)
    expect(result.current.members).toEqual([member1])
    expect(mocked.getGroup).toHaveBeenCalledWith("g1")
  })

  it("sets error when the initial fetch fails", async () => {
    mocked.getGroup.mockRejectedValue(new Error("Not found"))

    const { result } = renderHook(() => useGroup("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe("Not found")
  })

  it("addMember calls the api with groupId+email and refetches", async () => {
    mocked.getGroup.mockResolvedValue({ group: group1, members: [member1] })
    mocked.addGroupMember.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGroup("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addMember("bob@test.com")
    })

    expect(mocked.addGroupMember).toHaveBeenCalledWith("g1", "bob@test.com")
    expect(mocked.getGroup).toHaveBeenCalledTimes(2)
  })

  it("removeMember calls the api with groupId+userId and refetches", async () => {
    mocked.getGroup.mockResolvedValue({ group: group1, members: [member1] })
    mocked.removeGroupMember.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGroup("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeMember(1)
    })

    expect(mocked.removeGroupMember).toHaveBeenCalledWith("g1", 1)
    expect(mocked.getGroup).toHaveBeenCalledTimes(2)
  })

  it("propagates a thrown addMember error to the caller", async () => {
    mocked.getGroup.mockResolvedValue({ group: group1, members: [member1] })
    mocked.addGroupMember.mockRejectedValue(new Error("Already a member"))

    const { result } = renderHook(() => useGroup("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.addMember("a@test.com")).rejects.toThrow("Already a member")
  })
})

describe("useGroupExpenses", () => {
  it("fetches expenses on mount", async () => {
    mocked.listGroupExpenses.mockResolvedValue([expense1])

    const { result } = renderHook(() => useGroupExpenses("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.expenses).toEqual([expense1])
    expect(mocked.listGroupExpenses).toHaveBeenCalledWith("g1")
  })

  it("sets error when the initial fetch fails", async () => {
    mocked.listGroupExpenses.mockRejectedValue(new Error("Server error"))

    const { result } = renderHook(() => useGroupExpenses("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe("Server error")
  })

  it("addExpense calls the api with groupId+data and refetches", async () => {
    mocked.listGroupExpenses.mockResolvedValue([])
    mocked.addGroupExpense.mockResolvedValue(expense1)

    const { result } = renderHook(() => useGroupExpenses("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const data = { description: "Dinner", amount: 2000, date: "2026-01-03T00:00:00.000Z" }
    await act(async () => {
      await result.current.addExpense(data)
    })

    expect(mocked.addGroupExpense).toHaveBeenCalledWith("g1", data)
    expect(mocked.listGroupExpenses).toHaveBeenCalledTimes(2)
  })

  it("propagates a thrown addExpense error to the caller", async () => {
    mocked.listGroupExpenses.mockResolvedValue([])
    mocked.addGroupExpense.mockRejectedValue(new Error("Invalid amount"))

    const { result } = renderHook(() => useGroupExpenses("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      result.current.addExpense({ description: "Dinner", amount: -1, date: "2026-01-03T00:00:00.000Z" })
    ).rejects.toThrow("Invalid amount")
  })
})

describe("useGroupBalances", () => {
  it("fetches balances on mount", async () => {
    mocked.getGroupBalances.mockResolvedValue([balance1])

    const { result } = renderHook(() => useGroupBalances("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.balances).toEqual([balance1])
    expect(mocked.getGroupBalances).toHaveBeenCalledWith("g1")
  })

  it("sets error when the initial fetch fails", async () => {
    mocked.getGroupBalances.mockRejectedValue(new Error("Forbidden"))

    const { result } = renderHook(() => useGroupBalances("g1"))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe("Forbidden")
  })

  it("settleShare calls the api with groupId+expenseId+userId and refetches", async () => {
    mocked.getGroupBalances.mockResolvedValue([balance1])
    mocked.settleGroupShare.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGroupBalances("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.settleShare("e1", 1)
    })

    expect(mocked.settleGroupShare).toHaveBeenCalledWith("g1", "e1", 1)
    expect(mocked.getGroupBalances).toHaveBeenCalledTimes(2)
  })

  it("propagates a thrown settleShare error to the caller", async () => {
    mocked.getGroupBalances.mockResolvedValue([balance1])
    mocked.settleGroupShare.mockRejectedValue(new Error("Already settled"))

    const { result } = renderHook(() => useGroupBalances("g1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(result.current.settleShare("e1", 1)).rejects.toThrow("Already settled")
  })
})
