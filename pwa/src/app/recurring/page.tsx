"use client"

import { useState } from "react"
import { format } from "date-fns"
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
import { Pause, Play, X } from "lucide-react"
import { formatCents, dollarsToCents } from "@/lib/money"
import { useDB } from "@/contexts/db-context"
import type { RecurringTransaction } from "@/lib/db"

const FREQUENCIES: RecurringTransaction["frequency"][] = ["daily", "weekly", "monthly"]

function AddRecurringForm({
    defaultAccountId,
    onAdd,
}: {
    defaultAccountId: number | undefined
    onAdd: (data: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt">) => void
}) {
    const [type, setType] = useState<"expense" | "income">("expense")
    const [category, setCategory] = useState("")
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [frequency, setFrequency] = useState<RecurringTransaction["frequency"]>("monthly")

    const handleSubmit = () => {
        const dollars = parseFloat(amount)
        if (!description.trim() || isNaN(dollars) || dollars <= 0 || defaultAccountId === undefined) return
        const now = new Date()
        onAdd({
            accountId: defaultAccountId,
            type,
            category: category.trim() || "Other",
            description: description.trim(),
            amount: dollarsToCents(dollars),
            frequency,
            startDate: now,
            nextRunDate: now,
            isActive: true,
        })
        setCategory("")
        setDescription("")
        setAmount("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="recurring-description">Description</Label>
                <Input
                    id="recurring-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Gym membership"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="recurring-category">Category</Label>
                <Input
                    id="recurring-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Subscriptions"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="recurring-type">Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
                        <SelectTrigger id="recurring-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="recurring-frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringTransaction["frequency"])}>
                        <SelectTrigger id="recurring-frequency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FREQUENCIES.map((f) => (
                                <SelectItem key={f} value={f}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1">
                <Label htmlFor="recurring-amount">Amount</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                        id="recurring-amount"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Recurring Transaction
            </Button>
        </div>
    )
}

export default function RecurringPage() {
    const { recurring, accounts } = useDB()
    const all = recurring.recurringTransactions ?? []
    const defaultAccountId = accounts.accounts?.[0]?.id

    return (
        <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold">Recurring Transactions</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Recurring Transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="recurring-list">
                    {all.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recurring transactions yet.</p>
                    ) : (
                        all.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {item.frequency} · Next: {format(item.nextRunDate, "MMM d, yyyy")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{formatCents(item.amount)}</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={item.isActive ? `Pause ${item.description}` : `Resume ${item.description}`}
                                        onClick={() => recurring.updateRecurring(item.id!, { isActive: !item.isActive })}
                                    >
                                        {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label={`Delete ${item.description}`}
                                        onClick={() => recurring.deleteRecurring(item.id!)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Recurring Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddRecurringForm defaultAccountId={defaultAccountId} onAdd={recurring.addRecurring} />
                </CardContent>
            </Card>
        </div>
    )
}
