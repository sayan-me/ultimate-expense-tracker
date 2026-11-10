import {Request, Response} from "firebase-functions/v1";
import {getSupabaseClient} from "./supabase-client";
import {getAuthenticatedUserId} from "./sync";

/**
 * Phase 5: Groups & Splitting.
 *
 * Table-naming note: the Postgres tables backing this module are named
 * `splitting_groups` / `splitting_group_members` (NOT `groups` /
 * `group_members`) because those two names are already taken by an older,
 * never-wired-up design with a different column set (see
 * backend/db/supabase/migrations/20261110040000_group_splitting_tables.sql
 * for the full rationale). This is purely an internal storage detail —
 * every response below still calls these "groups" in the JSON the PWA
 * client sees.
 */

interface GroupRow {
  id: string;
  name: string;
  created_by: number;
  created_at: string;
  deleted_at?: string | null;
}

interface MemberRow {
  user_id: number;
  role: string;
  joined_at: string;
  removed_at?: string | null;
}

interface UserRow {
  id: number;
  name: string | null;
  email: string | null;
}

interface ExpenseRow {
  id: string;
  group_id: string;
  paid_by: number;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  deleted_at?: string | null;
}

interface ShareRow {
  group_expense_id: string;
  user_id: number;
  share_amount: number;
  is_settled: boolean;
}

/** Looks up the caller's active (not-removed) membership row for a group, or null. */
async function getActiveMembership(groupId: string, userId: number): Promise<{role: string} | null> {
  const {data, error} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .is("removed_at", null)
    .maybeSingle();

  if (error) throw error;
  return data as {role: string} | null;
}

/** All active (not-removed) members of a group, ordered by ascending user_id. */
async function getActiveMembers(groupId: string): Promise<MemberRow[]> {
  const {data, error} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("user_id, role, joined_at")
    .eq("group_id", groupId)
    .is("removed_at", null)
    .order("user_id", {ascending: true});

  if (error) throw error;
  return (data ?? []) as MemberRow[];
}

async function getUsersByIds(ids: number[]): Promise<UserRow[]> {
  if (ids.length === 0) return [];
  const {data, error} = await getSupabaseClient()
    .from("users")
    .select("id, name, email")
    .in("id", ids);

  if (error) throw error;
  return (data ?? []) as UserRow[];
}

function groupToResponse(row: GroupRow, memberCount: number) {
  return {
    id: row.id,
    name: row.name,
    createdBy: Number(row.created_by),
    createdAt: row.created_at,
    memberCount,
  };
}

function expenseToResponse(row: ExpenseRow, shares: Array<{userId: number; shareAmount: number; isSettled: boolean}>) {
  return {
    id: row.id,
    groupId: row.group_id,
    paidBy: Number(row.paid_by),
    amount: row.amount,
    description: row.description,
    category: row.category ?? null,
    date: row.date,
    shares,
  };
}

/** Splits `amount` cents evenly across `memberIdsAscending`, remainder going to the lowest user ids. */
function splitEvenly(amount: number, memberIdsAscending: number[]): Map<number, number> {
  const memberCount = memberIdsAscending.length;
  const base = Math.floor(amount / memberCount);
  const remainder = amount - base * memberCount;
  const shares = new Map<number, number>();
  memberIdsAscending.forEach((userId, index) => {
    shares.set(userId, index < remainder ? base + 1 : base);
  });
  return shares;
}

async function createGroup(req: Request, res: Response, userId: number) {
  const {name} = req.body as {name?: string};
  if (!name || !name.trim()) {
    res.status(400).json({error: "Group name is required"});
    return;
  }

  const {data: group, error: groupError} = await getSupabaseClient()
    .from("splitting_groups")
    .insert({name: name.trim(), created_by: userId})
    .select("id, name, created_by, created_at")
    .single();

  if (groupError) throw groupError;
  const groupRow = group as GroupRow;

  const {error: memberError} = await getSupabaseClient()
    .from("splitting_group_members")
    .insert({group_id: groupRow.id, user_id: userId, role: "owner"});

  if (memberError) throw memberError;

  res.json({group: groupToResponse(groupRow, 1)});
}

async function listGroups(req: Request, res: Response, userId: number) {
  const {data: memberships, error: membershipError} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("group_id")
    .eq("user_id", userId)
    .is("removed_at", null);

  if (membershipError) throw membershipError;

  const groupIds = ((memberships ?? []) as Array<{group_id: string}>).map((m) => m.group_id);
  if (groupIds.length === 0) {
    res.json({groups: []});
    return;
  }

  const {data: groups, error: groupsError} = await getSupabaseClient()
    .from("splitting_groups")
    .select("id, name, created_by, created_at")
    .in("id", groupIds)
    .is("deleted_at", null);

  if (groupsError) throw groupsError;

  const {data: allMembers, error: allMembersError} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("group_id")
    .in("group_id", groupIds)
    .is("removed_at", null);

  if (allMembersError) throw allMembersError;

  const counts = new Map<string, number>();
  for (const row of (allMembers ?? []) as Array<{group_id: string}>) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
  }

  const result = ((groups ?? []) as GroupRow[]).map((row) =>
    groupToResponse(row, counts.get(row.id) ?? 0)
  );

  res.json({groups: result});
}

async function getGroupDetail(req: Request, res: Response, userId: number, groupId: string) {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    res.status(403).json({error: "Not a member of this group"});
    return;
  }

  const {data: group, error: groupError} = await getSupabaseClient()
    .from("splitting_groups")
    .select("id, name, created_by, created_at, deleted_at")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throw groupError;
  const groupRow = group as GroupRow | null;
  if (!groupRow || groupRow.deleted_at) {
    res.status(404).json({error: "Group not found"});
    return;
  }

  const members = await getActiveMembers(groupId);
  const users = await getUsersByIds(members.map((m) => m.user_id));
  const usersById = new Map(users.map((u) => [u.id, u]));

  const memberResponses = members.map((m) => ({
    userId: Number(m.user_id),
    name: usersById.get(m.user_id)?.name ?? null,
    email: usersById.get(m.user_id)?.email ?? null,
    role: m.role,
    joinedAt: m.joined_at,
  }));

  res.json({
    group: groupToResponse(groupRow, members.length),
    members: memberResponses,
  });
}

async function addMember(req: Request, res: Response, userId: number, groupId: string) {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership || membership.role !== "owner") {
    res.status(403).json({error: "Only the group owner can add members"});
    return;
  }

  const {email} = req.body as {email?: string};
  if (!email || !email.trim()) {
    res.status(400).json({error: "Email is required"});
    return;
  }

  const {data: targetUser, error: userError} = await getSupabaseClient()
    .from("users")
    .select("id, name, email")
    .eq("email", email.trim())
    .maybeSingle();

  if (userError) throw userError;
  if (!targetUser) {
    res.status(404).json({error: "No account found with that email"});
    return;
  }
  const targetUserRow = targetUser as UserRow;

  const {data: existingMembership, error: existingError} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("id, removed_at")
    .eq("group_id", groupId)
    .eq("user_id", targetUserRow.id)
    .maybeSingle();

  if (existingError) throw existingError;
  const existing = existingMembership as {id: string; removed_at: string | null} | null;

  if (existing && !existing.removed_at) {
    res.status(409).json({error: "Already a member"});
    return;
  }

  const joinedAt = new Date().toISOString();

  if (existing) {
    // Rejoining after a previous soft-removal: update the existing row
    // rather than inserting, since (group_id, user_id) is unique.
    const {error: updateError} = await getSupabaseClient()
      .from("splitting_group_members")
      .update({role: "member", removed_at: null, joined_at: joinedAt})
      .eq("id", existing.id);

    if (updateError) throw updateError;
  } else {
    const {error: insertError} = await getSupabaseClient()
      .from("splitting_group_members")
      .insert({group_id: groupId, user_id: targetUserRow.id, role: "member", joined_at: joinedAt});

    if (insertError) throw insertError;
  }

  res.json({
    member: {
      userId: Number(targetUserRow.id),
      name: targetUserRow.name,
      email: targetUserRow.email,
      role: "member",
      joinedAt,
    },
  });
}

async function removeMember(req: Request, res: Response, userId: number, groupId: string, targetUserIdParam: string) {
  const targetUserId = Number(targetUserIdParam);
  const membership = await getActiveMembership(groupId, userId);
  const isOwner = membership?.role === "owner";
  const isSelf = userId === targetUserId;

  if (!isOwner && !isSelf) {
    res.status(403).json({error: "Only the group owner can remove other members"});
    return;
  }

  const {data: targetMembership, error: targetError} = await getSupabaseClient()
    .from("splitting_group_members")
    .select("id, removed_at")
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (targetError) throw targetError;
  const target = targetMembership as {id: string; removed_at: string | null} | null;
  if (!target) {
    res.status(404).json({error: "Member not found"});
    return;
  }

  if (!target.removed_at) {
    const {error: updateError} = await getSupabaseClient()
      .from("splitting_group_members")
      .update({removed_at: new Date().toISOString()})
      .eq("id", target.id);

    if (updateError) throw updateError;
  }

  res.json({success: true});
}

async function addExpense(req: Request, res: Response, userId: number, groupId: string) {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    res.status(403).json({error: "Not a member of this group"});
    return;
  }

  const {description, amount, category, date} = req.body as {
    description?: string;
    amount?: number;
    category?: string;
    date?: string;
  };

  if (!description || !description.trim()) {
    res.status(400).json({error: "Description is required"});
    return;
  }
  if (!date) {
    res.status(400).json({error: "Date is required"});
    return;
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    res.status(400).json({error: "Amount must be a positive integer (cents)"});
    return;
  }

  const members = await getActiveMembers(groupId);
  const memberIds = members.map((m) => m.user_id).sort((a, b) => a - b);

  const {data: expense, error: expenseError} = await getSupabaseClient()
    .from("group_expenses")
    .insert({
      group_id: groupId,
      paid_by: userId,
      amount,
      description: description.trim(),
      category: category ?? null,
      date,
    })
    .select("id, group_id, paid_by, amount, description, category, date")
    .single();

  if (expenseError) throw expenseError;
  const expenseRow = expense as ExpenseRow;

  const shareAmounts = splitEvenly(amount, memberIds);
  const shareRows = memberIds.map((memberUserId) => ({
    group_expense_id: expenseRow.id,
    user_id: memberUserId,
    share_amount: shareAmounts.get(memberUserId) ?? 0,
    is_settled: false,
  }));

  const {error: sharesError} = await getSupabaseClient()
    .from("group_expense_shares")
    .insert(shareRows);

  if (sharesError) throw sharesError;

  const shares = shareRows.map((s) => ({
    userId: Number(s.user_id),
    shareAmount: s.share_amount,
    isSettled: s.is_settled,
  }));

  res.json({expense: expenseToResponse(expenseRow, shares)});
}

async function listExpenses(req: Request, res: Response, userId: number, groupId: string) {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    res.status(403).json({error: "Not a member of this group"});
    return;
  }

  const {data: expenses, error: expensesError} = await getSupabaseClient()
    .from("group_expenses")
    .select("id, group_id, paid_by, amount, description, category, date")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("date", {ascending: false});

  if (expensesError) throw expensesError;
  const expenseRows = (expenses ?? []) as ExpenseRow[];

  if (expenseRows.length === 0) {
    res.json({expenses: []});
    return;
  }

  const {data: shares, error: sharesError} = await getSupabaseClient()
    .from("group_expense_shares")
    .select("group_expense_id, user_id, share_amount, is_settled")
    .in("group_expense_id", expenseRows.map((e) => e.id));

  if (sharesError) throw sharesError;
  const shareRows = (shares ?? []) as ShareRow[];

  const sharesByExpense = new Map<string, Array<{userId: number; shareAmount: number; isSettled: boolean}>>();
  for (const share of shareRows) {
    const list = sharesByExpense.get(share.group_expense_id) ?? [];
    list.push({userId: Number(share.user_id), shareAmount: share.share_amount, isSettled: share.is_settled});
    sharesByExpense.set(share.group_expense_id, list);
  }

  const result = expenseRows.map((row) => expenseToResponse(row, sharesByExpense.get(row.id) ?? []));
  res.json({expenses: result});
}

async function getBalances(req: Request, res: Response, userId: number, groupId: string) {
  const membership = await getActiveMembership(groupId, userId);
  if (!membership) {
    res.status(403).json({error: "Not a member of this group"});
    return;
  }

  const members = await getActiveMembers(groupId);

  const {data: expenses, error: expensesError} = await getSupabaseClient()
    .from("group_expenses")
    .select("id, paid_by")
    .eq("group_id", groupId)
    .is("deleted_at", null);

  if (expensesError) throw expensesError;
  const expenseRows = (expenses ?? []) as Array<{id: string; paid_by: number}>;
  const paidByByExpenseId = new Map(expenseRows.map((e) => [e.id, Number(e.paid_by)]));

  const owes = new Map<number, number>();
  const owedToThem = new Map<number, number>();

  if (expenseRows.length > 0) {
    const {data: shares, error: sharesError} = await getSupabaseClient()
      .from("group_expense_shares")
      .select("group_expense_id, user_id, share_amount")
      .in("group_expense_id", expenseRows.map((e) => e.id))
      .eq("is_settled", false);

    if (sharesError) throw sharesError;

    for (const share of (shares ?? []) as Array<{group_expense_id: string; user_id: number; share_amount: number}>) {
      const payer = paidByByExpenseId.get(share.group_expense_id);
      const owerId = Number(share.user_id);
      if (payer === undefined || payer === owerId) continue;
      owes.set(owerId, (owes.get(owerId) ?? 0) + share.share_amount);
      owedToThem.set(payer, (owedToThem.get(payer) ?? 0) + share.share_amount);
    }
  }

  const users = await getUsersByIds(members.map((m) => m.user_id));
  const usersById = new Map(users.map((u) => [u.id, u]));

  const balances = members.map((m) => {
    const uid = Number(m.user_id);
    return {
      userId: uid,
      name: usersById.get(m.user_id)?.name ?? null,
      netBalance: (owedToThem.get(uid) ?? 0) - (owes.get(uid) ?? 0),
    };
  });

  res.json({balances});
}

async function settleShare(
  req: Request,
  res: Response,
  userId: number,
  groupId: string,
  expenseId: string,
  targetUserIdParam: string
) {
  const targetUserId = Number(targetUserIdParam);

  const {data: expense, error: expenseError} = await getSupabaseClient()
    .from("group_expenses")
    .select("id, group_id, paid_by")
    .eq("id", expenseId)
    .eq("group_id", groupId)
    .maybeSingle();

  if (expenseError) throw expenseError;
  const expenseRow = expense as {id: string; group_id: string; paid_by: number} | null;
  if (!expenseRow) {
    res.status(404).json({error: "Expense not found"});
    return;
  }

  const isPayer = Number(expenseRow.paid_by) === userId;
  const isOwer = userId === targetUserId;
  if (!isPayer && !isOwer) {
    res.status(403).json({error: "Only the payer or the ower can settle this share"});
    return;
  }

  const {data: share, error: shareError} = await getSupabaseClient()
    .from("group_expense_shares")
    .select("id")
    .eq("group_expense_id", expenseId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (shareError) throw shareError;
  const shareRow = share as {id: string} | null;
  if (!shareRow) {
    res.status(404).json({error: "Share not found"});
    return;
  }

  const {error: updateError} = await getSupabaseClient()
    .from("group_expense_shares")
    .update({is_settled: true, settled_at: new Date().toISOString()})
    .eq("id", shareRow.id);

  if (updateError) throw updateError;

  res.json({success: true});
}

/**
 * Routes `/groups/...` requests. `path` is the URL path split into
 * segments with the leading "groups" segment already stripped by the
 * caller (backend/services/user-service/functions/src/index.ts).
 */
export async function handleGroups(req: Request, res: Response, path: string[]) {
  try {
    const userId = await getAuthenticatedUserId(req);
    if (userId === null) {
      res.status(401).json({error: "No valid authorization header"});
      return;
    }

    if (path.length === 0) {
      if (req.method === "POST") {
        await createGroup(req, res, userId);
        return;
      }
      if (req.method === "GET") {
        await listGroups(req, res, userId);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const groupId = path[0];

    if (path.length === 1) {
      if (req.method === "GET") {
        await getGroupDetail(req, res, userId, groupId);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (path.length === 2 && path[1] === "members") {
      if (req.method === "POST") {
        await addMember(req, res, userId, groupId);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (path.length === 3 && path[1] === "members") {
      if (req.method === "DELETE") {
        await removeMember(req, res, userId, groupId, path[2]);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (path.length === 2 && path[1] === "expenses") {
      if (req.method === "POST") {
        await addExpense(req, res, userId, groupId);
        return;
      }
      if (req.method === "GET") {
        await listExpenses(req, res, userId, groupId);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (path.length === 2 && path[1] === "balances") {
      if (req.method === "GET") {
        await getBalances(req, res, userId, groupId);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (path.length === 6 && path[1] === "expenses" && path[3] === "shares" && path[5] === "settle") {
      if (req.method === "POST") {
        await settleShare(req, res, userId, groupId, path[2], path[4]);
        return;
      }
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    res.status(404).json({error: "Not found"});
  } catch (error: unknown) {
    res.status(500).json({
      error: "Groups request failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
