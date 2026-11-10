import { authService } from "@/services/auth.service"
import { env } from "@/config/env"

export interface GroupSummary {
  id: string
  name: string
  createdBy: number
  createdAt: string
  memberCount: number
}

export interface GroupMember {
  userId: number
  name: string | null
  email: string
  role: "owner" | "member"
  joinedAt: string
}

export interface GroupExpenseShare {
  userId: number
  shareAmount: number
  isSettled: boolean
}

export interface GroupExpense {
  id: string
  groupId: string
  paidBy: number
  amount: number
  description: string
  category: string | null
  date: string
  shares: GroupExpenseShare[]
}

export interface GroupBalance {
  userId: number
  name: string | null
  netBalance: number
}

async function getAuthToken(): Promise<string> {
  const token = await authService.getIdToken()
  if (!token) throw new Error("Not signed in")
  return token
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string }
    return body.message ?? body.error ?? "Request failed"
  } catch {
    return "Request failed"
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const token = await getAuthToken()
  const { method = "GET", body } = options

  const response = await fetch(`${env.api.userServiceUrl}/groups${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

export async function createGroup(name: string): Promise<GroupSummary> {
  const { group } = await request<{ group: GroupSummary }>("", {
    method: "POST",
    body: { name },
  })
  return group
}

export async function listGroups(): Promise<GroupSummary[]> {
  const { groups } = await request<{ groups: GroupSummary[] }>("")
  return groups
}

export async function getGroup(
  groupId: string
): Promise<{ group: GroupSummary; members: GroupMember[] }> {
  return await request<{ group: GroupSummary; members: GroupMember[] }>(`/${groupId}`)
}

export async function addGroupMember(groupId: string, email: string): Promise<GroupMember> {
  const { member } = await request<{ member: GroupMember }>(`/${groupId}/members`, {
    method: "POST",
    body: { email },
  })
  return member
}

export async function removeGroupMember(groupId: string, userId: number): Promise<void> {
  await request<{ success: true }>(`/${groupId}/members/${userId}`, { method: "DELETE" })
}

export async function addGroupExpense(
  groupId: string,
  data: { description: string; amount: number; category?: string; date: string }
): Promise<GroupExpense> {
  const { expense } = await request<{ expense: GroupExpense }>(`/${groupId}/expenses`, {
    method: "POST",
    body: data,
  })
  return expense
}

export async function listGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const { expenses } = await request<{ expenses: GroupExpense[] }>(`/${groupId}/expenses`)
  return expenses
}

export async function getGroupBalances(groupId: string): Promise<GroupBalance[]> {
  const { balances } = await request<{ balances: GroupBalance[] }>(`/${groupId}/balances`)
  return balances
}

export async function settleGroupShare(
  groupId: string,
  expenseId: string,
  userId: number
): Promise<void> {
  await request<{ success: true }>(`/${groupId}/expenses/${expenseId}/shares/${userId}/settle`, {
    method: "POST",
  })
}
