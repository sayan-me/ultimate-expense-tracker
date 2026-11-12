"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { formatCents, dollarsToCents } from "@/lib/money"
import { useCurrencySymbol } from "@/stores/preferences"
import { computeAccountBalance } from "@/lib/account-balance"
import { useDB } from "@/contexts/db-context"
import type { Account } from "@/lib/db"

/** A "goal" is a savings account with a target — a plain savings account (no target) isn't one. */
function isGoalAccount(account: Account): account is Account & { targetAmount: number } {
    return account.type === "savings" && account.targetAmount !== undefined
}

function AddGoalForm({ onAdd }: { onAdd: (data: { name: string; targetAmount: number }) => void }) {
    const currencySymbol = useCurrencySymbol()
    const [name, setName] = useState("")
    const [targetAmount, setTargetAmount] = useState("")

    const handleSubmit = () => {
        const dollars = parseFloat(targetAmount)
        if (!name.trim() || isNaN(dollars) || dollars <= 0) return
        onAdd({ name: name.trim(), targetAmount: dollarsToCents(dollars) })
        setName("")
        setTargetAmount("")
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Label htmlFor="goal-name">Goal name</Label>
                <Input id="goal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Laptop" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="goal-target">Target amount</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                    <Input
                        id="goal-target"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
            </div>
            <Button type="button" onClick={handleSubmit}>
                Add Goal
            </Button>
        </div>
    )
}

export default function GoalsPage() {
    const { accounts, transactions } = useDB()
    const allAccounts = accounts.accounts ?? []
    const allTransactions = transactions.transactions ?? []
    const goals = allAccounts.filter(isGoalAccount)

    const handleAdd = async (data: { name: string; targetAmount: number }) => {
        await accounts.addAccount({ name: data.name, type: "savings", openingBalance: 0, targetAmount: data.targetAmount, isDefault: false })
    }

    return (
        <div className="py-6 space-y-4">
            <h1 className="text-2xl font-bold">Savings Goals</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-testid="goal-list">
                    {goals.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No savings goals yet.</p>
                    ) : (
                        goals.map((goal) => {
                            const saved = computeAccountBalance(goal, allTransactions)
                            const percentage = (saved / goal.targetAmount) * 100
                            const reached = percentage >= 100
                            return (
                                <div key={goal.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{goal.name}</p>
                                        {reached && <span className="text-xs font-medium text-primary">Goal reached! 🎉</span>}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{formatCents(saved)} saved</span>
                                        <span className="text-muted-foreground">of {formatCents(goal.targetAmount)}</span>
                                    </div>
                                    <Progress value={Math.min(Math.max(percentage, 0), 100)} className="h-2" />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {Math.max(percentage, 0).toFixed(0)}% saved
                                    </p>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add Goal</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddGoalForm onAdd={handleAdd} />
                </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
                Contribute to a goal by transferring money to it from the{" "}
                <a href="/accounts" className="text-primary hover:underline">
                    Accounts
                </a>{" "}
                page.
            </p>
        </div>
    )
}
