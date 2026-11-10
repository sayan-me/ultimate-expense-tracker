import { useCallback, useEffect, useState } from "react"
import {
  addGroupExpense,
  addGroupMember,
  createGroup as apiCreateGroup,
  getGroup,
  getGroupBalances,
  listGroupExpenses,
  listGroups,
  removeGroupMember,
  settleGroupShare,
  type GroupBalance,
  type GroupExpense,
  type GroupMember,
  type GroupSummary,
} from "@/lib/groups-api"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupSummary[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listGroups()
      setGroups(result)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createGroup = useCallback(
    async (name: string) => {
      const group = await apiCreateGroup(name)
      await refetch()
      return group
    },
    [refetch]
  )

  return { groups, loading, error, createGroup, refetch }
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<GroupSummary | undefined>(undefined)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getGroup(groupId)
      setGroup(result.group)
      setMembers(result.members)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addMember = useCallback(
    async (email: string) => {
      await addGroupMember(groupId, email)
      await refetch()
    },
    [groupId, refetch]
  )

  const removeMember = useCallback(
    async (userId: number) => {
      await removeGroupMember(groupId, userId)
      await refetch()
    },
    [groupId, refetch]
  )

  return { group, members, loading, error, addMember, removeMember, refetch }
}

export function useGroupExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<GroupExpense[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listGroupExpenses(groupId)
      setExpenses(result)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const addExpense = useCallback(
    async (data: { description: string; amount: number; category?: string; date: string }) => {
      await addGroupExpense(groupId, data)
      await refetch()
    },
    [groupId, refetch]
  )

  return { expenses, loading, error, addExpense, refetch }
}

export function useGroupBalances(groupId: string) {
  const [balances, setBalances] = useState<GroupBalance[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getGroupBalances(groupId)
      setBalances(result)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const settleShare = useCallback(
    async (expenseId: string, userId: number) => {
      await settleGroupShare(groupId, expenseId, userId)
      await refetch()
    },
    [groupId, refetch]
  )

  return { balances, loading, error, settleShare, refetch }
}
