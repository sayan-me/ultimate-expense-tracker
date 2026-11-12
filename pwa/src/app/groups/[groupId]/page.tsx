"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { formatCents, dollarsToCents } from "@/lib/money"
import { useCurrencySymbol } from "@/stores/preferences"
import { useAuth } from "@/contexts/auth-context"
import { useGroup, useGroupExpenses, useGroupBalances } from "@/hooks/use-groups"
import type { GroupMember } from "@/lib/groups-api"

function AddMemberForm({ onAdd }: { onAdd: (email: string) => void }) {
    const [email, setEmail] = useState("")

    const handleSubmit = () => {
        if (!email.trim()) return
        onAdd(email.trim())
        setEmail("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="member-email">Add member by email</Label>
                <Input
                    id="member-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@example.com"
                />
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Member
            </Button>
        </div>
    )
}

function AddExpenseForm({
    onAdd,
}: {
    onAdd: (data: { description: string; amount: number; category?: string; date: string }) => void
}) {
    const currencySymbol = useCurrencySymbol()
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [category, setCategory] = useState("")
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

    const handleSubmit = () => {
        if (!description.trim()) return
        const dollars = parseFloat(amount)
        if (isNaN(dollars) || dollars <= 0) return
        onAdd({
            description: description.trim(),
            amount: dollarsToCents(dollars),
            category: category.trim() ? category.trim() : undefined,
            date,
        })
        setDescription("")
        setAmount("")
        setCategory("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="expense-description">Description</Label>
                <Input
                    id="expense-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Groceries"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="expense-amount">Amount</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="expense-category">Category (optional)</Label>
                <Input
                    id="expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Food"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="expense-date">Date</Label>
                <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Expense
            </Button>
        </div>
    )
}

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>()
    const { user } = useAuth()
    const currentUserId = user ? Number(user.id) : NaN

    const { group, members, loading: groupLoading, error: groupError, addMember, removeMember } = useGroup(groupId)
    const {
        expenses,
        loading: expensesLoading,
        error: expensesError,
        addExpense,
        refetch: refetchExpenses,
    } = useGroupExpenses(groupId)
    const {
        balances,
        loading: balancesLoading,
        error: balancesError,
        settleShare,
        refetch: refetchBalances,
    } = useGroupBalances(groupId)

    const [memberError, setMemberError] = useState<string | null>(null)
    const [expenseError, setExpenseError] = useState<string | null>(null)
    const [settleError, setSettleError] = useState<string | null>(null)
    const [pendingRemove, setPendingRemove] = useState<GroupMember | null>(null)

    const allMembers = members ?? []
    const allExpenses = expenses ?? []
    const allBalances = balances ?? []

    const isOwner = allMembers.some((m) => m.userId === currentUserId && m.role === "owner")

    const handleAddMember = async (email: string) => {
        setMemberError(null)
        try {
            await addMember(email)
        } catch (err) {
            setMemberError(err instanceof Error ? err.message : "Failed to add member")
        }
    }

    const handleConfirmRemove = async () => {
        if (!pendingRemove) return
        setMemberError(null)
        try {
            await removeMember(pendingRemove.userId)
            setPendingRemove(null)
        } catch (err) {
            setMemberError(err instanceof Error ? err.message : "Failed to remove member")
            setPendingRemove(null)
        }
    }

    const handleAddExpense = async (data: { description: string; amount: number; category?: string; date: string }) => {
        setExpenseError(null)
        try {
            await addExpense(data)
            // addExpense only refreshes useGroupExpenses's own state — a new
            // expense changes net balances too, and nothing else would
            // refresh that separate hook's (stale) data otherwise.
            await refetchBalances()
        } catch (err) {
            setExpenseError(err instanceof Error ? err.message : "Failed to add expense")
        }
    }

    const handleSettle = async (expenseId: string) => {
        setSettleError(null)
        try {
            await settleShare(expenseId, currentUserId)
            // settleShare only refreshes useGroupBalances's own state — the
            // "You owe for" list above reads share.isSettled off
            // useGroupExpenses's separate state, which needs its own refresh
            // or a just-settled share keeps showing as unsettled.
            await refetchExpenses()
        } catch (err) {
            setSettleError(err instanceof Error ? err.message : "Failed to mark share as settled")
        }
    }

    const payerLabel = (paidBy: number) => {
        if (paidBy === currentUserId) return "You"
        const payer = allMembers.find((m) => m.userId === paidBy)
        return payer?.name ?? payer?.email ?? `User ${paidBy}`
    }

    const myBalance = allBalances.find((b) => b.userId === currentUserId)
    const myUnsettledShares =
        myBalance && myBalance.netBalance < 0
            ? allExpenses.flatMap((expense) =>
                  expense.paidBy === currentUserId
                      ? []
                      : expense.shares
                            .filter((share) => share.userId === currentUserId && !share.isSettled)
                            .map((share) => ({ expense, share }))
              )
            : []

    return (
        <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold">{group ? group.name : "Group"}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="member-list">
                    {groupLoading && <p className="text-sm text-muted-foreground">Loading members...</p>}
                    {groupError && <p className="text-sm text-destructive">{groupError}</p>}
                    {memberError && <p className="text-sm text-destructive">{memberError}</p>}
                    {!groupLoading &&
                        !groupError &&
                        allMembers.map((member) => {
                            const isSelf = member.userId === currentUserId
                            return (
                                <div key={member.userId} className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="font-medium">{member.name ?? member.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {member.email} &middot; <span className="capitalize">{member.role}</span>
                                        </p>
                                    </div>
                                    {isSelf && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            aria-label="Leave group"
                                            onClick={() => setPendingRemove(member)}
                                        >
                                            Leave group
                                        </Button>
                                    )}
                                    {!isSelf && isOwner && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label={`Remove ${member.name ?? member.email}`}
                                            onClick={() => setPendingRemove(member)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )
                        })}

                    {isOwner && (
                        <div className="pt-2">
                            <AddMemberForm onAdd={handleAddMember} />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={pendingRemove !== null} onOpenChange={(open) => !open && setPendingRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {pendingRemove?.userId === currentUserId
                                ? `Leave ${group?.name ?? "this group"}?`
                                : `Remove ${pendingRemove?.name ?? pendingRemove?.email}?`}
                        </DialogTitle>
                        <DialogDescription>This can&apos;t be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingRemove(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmRemove}>
                            {pendingRemove?.userId === currentUserId ? "Leave" : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Balances</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="balance-list">
                    {balancesLoading && <p className="text-sm text-muted-foreground">Loading balances...</p>}
                    {balancesError && <p className="text-sm text-destructive">{balancesError}</p>}
                    {settleError && <p className="text-sm text-destructive">{settleError}</p>}
                    {!balancesLoading &&
                        !balancesError &&
                        allBalances.map((balance) => (
                            <div key={balance.userId} className="flex items-center justify-between rounded-md border p-3">
                                <p className="font-medium">{balance.userId === currentUserId ? "You" : balance.name ?? "Unknown"}</p>
                                {balance.netBalance >= 0 ? (
                                    <p className="text-sm text-green-600">is owed {formatCents(balance.netBalance)}</p>
                                ) : (
                                    <p className="text-sm text-red-600">owes {formatCents(Math.abs(balance.netBalance))}</p>
                                )}
                            </div>
                        ))}

                    {myUnsettledShares.length > 0 && (
                        <div className="pt-2 space-y-2">
                            <p className="text-sm font-medium">You owe for:</p>
                            {myUnsettledShares.map(({ expense, share }) => (
                                <div
                                    key={`${expense.id}-${share.userId}`}
                                    className="flex items-center justify-between rounded-md border p-3"
                                >
                                    <div>
                                        <p className="text-sm">{expense.description}</p>
                                        <p className="text-sm text-muted-foreground">{formatCents(share.shareAmount)}</p>
                                    </div>
                                    <Button type="button" size="sm" variant="outline" onClick={() => handleSettle(expense.id)}>
                                        Mark as settled
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Expenses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="expense-list">
                    {expensesLoading && <p className="text-sm text-muted-foreground">Loading expenses...</p>}
                    {expensesError && <p className="text-sm text-destructive">{expensesError}</p>}
                    {expenseError && <p className="text-sm text-destructive">{expenseError}</p>}
                    {!expensesLoading &&
                        !expensesError &&
                        allExpenses.map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Paid by {payerLabel(expense.paidBy)} &middot; {expense.date}
                                    </p>
                                </div>
                                <p className="font-medium">{formatCents(expense.amount)}</p>
                            </div>
                        ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Expense</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddExpenseForm onAdd={handleAddExpense} />
                </CardContent>
            </Card>
        </div>
    )
}
