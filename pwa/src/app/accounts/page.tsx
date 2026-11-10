"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { computeAccountBalance } from "@/lib/account-balance"
import { AccountSelector } from "@/components/expense/account-selector"
import { useDB } from "@/contexts/db-context"
import type { Account } from "@/lib/db"

const ACCOUNT_TYPES: Account["type"][] = ["cash", "bank", "credit", "savings"]

function AddAccountForm({ onAdd }: { onAdd: (data: { name: string; type: Account["type"]; openingBalance: number }) => void }) {
    const [name, setName] = useState("")
    const [type, setType] = useState<Account["type"]>("cash")
    const [openingBalance, setOpeningBalance] = useState("")

    const handleSubmit = () => {
        if (!name.trim()) return
        const dollars = parseFloat(openingBalance)
        onAdd({ name: name.trim(), type, openingBalance: dollarsToCents(isNaN(dollars) ? 0 : dollars) })
        setName("")
        setOpeningBalance("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="account-name">Account name</Label>
                <Input id="account-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Checking" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="account-type">Account type</Label>
                <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
                    <SelectTrigger id="account-type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ACCOUNT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label htmlFor="opening-balance">Opening balance</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                        id="opening-balance"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Account
            </Button>
        </div>
    )
}

function TransferForm({
    accounts,
    transactions,
    onTransfer,
}: {
    accounts: Account[]
    transactions: ReturnType<typeof useDB>["transactions"]["transactions"]
    onTransfer: (data: { fromAccountId: number; toAccountId: number; amount: number; description: string }) => void
}) {
    const [fromAccountId, setFromAccountId] = useState<number | undefined>(undefined)
    const [toAccountId, setToAccountId] = useState<number | undefined>(undefined)
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [resultingBalance, setResultingBalance] = useState<number | null>(null)

    const runTransfer = (fromId: number, toId: number, cents: number) => {
        onTransfer({ fromAccountId: fromId, toAccountId: toId, amount: cents, description })
        setAmount("")
        setDescription("")
        setResultingBalance(null)
    }

    const handleSubmit = () => {
        const dollars = parseFloat(amount)
        if (fromAccountId === undefined || toAccountId === undefined || isNaN(dollars) || dollars <= 0) return
        const cents = dollarsToCents(dollars)

        // A2 in the real-user test report: a transfer that overdraws the
        // source account went through instantly with no warning. Only
        // interrupt the ones that actually would — a normal transfer stays
        // a single click.
        const fromAccount = accounts.find((a) => a.id === fromAccountId)
        const currentBalance = fromAccount ? computeAccountBalance(fromAccount, transactions ?? []) : 0
        const balanceAfter = currentBalance - cents
        if (balanceAfter < 0) {
            setResultingBalance(balanceAfter)
            return
        }

        runTransfer(fromAccountId, toAccountId, cents)
    }

    const handleConfirmOverdraft = () => {
        if (fromAccountId === undefined || toAccountId === undefined) return
        runTransfer(fromAccountId, toAccountId, dollarsToCents(parseFloat(amount)))
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label>From</Label>
                    <AccountSelector
                        value={fromAccountId}
                        onChange={setFromAccountId}
                        accounts={accounts}
                        transactions={transactions ?? []}
                        placeholder="From account"
                    />
                </div>
                <div className="space-y-1">
                    <Label>To</Label>
                    <AccountSelector
                        value={toAccountId}
                        onChange={setToAccountId}
                        accounts={accounts}
                        transactions={transactions ?? []}
                        excludeAccountId={fromAccountId}
                        placeholder="To account"
                    />
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="transfer-amount">Transfer amount</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                        id="transfer-amount"
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
                <Label htmlFor="transfer-description">Description (optional)</Label>
                <Input
                    id="transfer-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Monthly savings"
                />
            </div>
            <Button type="button" onClick={handleSubmit}>
                Transfer
            </Button>

            <Dialog open={resultingBalance !== null} onOpenChange={(open) => !open && setResultingBalance(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>This will overdraw the account</DialogTitle>
                        <DialogDescription>
                            This leaves the source account at {resultingBalance !== null && formatCents(resultingBalance)}.
                            Continue anyway?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResultingBalance(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmOverdraft}>
                            Transfer Anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function AccountsPage() {
    const { accounts, transactions } = useDB()
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState<Account | null>(null)
    const allAccounts = accounts.accounts ?? []
    const allTransactions = transactions.transactions ?? []

    const handleAdd = async (data: { name: string; type: Account["type"]; openingBalance: number }) => {
        await accounts.addAccount({ ...data, isDefault: false })
    }

    const handleConfirmDelete = async () => {
        if (!pendingDelete) return
        setDeleteError(null)
        try {
            await accounts.deleteAccount(pendingDelete.id!)
            setPendingDelete(null)
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "Failed to delete account")
            setPendingDelete(null)
        }
    }

    const handleTransfer = async (data: { fromAccountId: number; toAccountId: number; amount: number; description: string }) => {
        await transactions.createTransfer({ ...data, date: new Date() })
    }

    return (
        <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold">Accounts</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="account-list">
                    {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                    {allAccounts.map((account) => (
                        <div key={account.id} className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{formatCents(computeAccountBalance(account, allTransactions))}</p>
                                {!account.isDefault && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={`Delete ${account.name}`}
                                        onClick={() => setPendingDelete(account)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
                        <DialogDescription>This can&apos;t be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddAccountForm onAdd={handleAdd} />
                </CardContent>
            </Card>

            {allAccounts.length >= 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Transfer Between Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TransferForm accounts={allAccounts} transactions={allTransactions} onTransfer={handleTransfer} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
