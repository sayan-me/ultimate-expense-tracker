"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatCents } from "@/lib/money"
import { computeAccountBalance } from "@/lib/account-balance"
import type { Account, Transaction } from "@/lib/db"

interface AccountSelectorProps {
    value: number | undefined
    onChange: (accountId: number) => void
    accounts: Account[]
    transactions: Transaction[]
    /** Omits one account from the list — e.g. a transfer's "to" picker excluding the "from" account already chosen. */
    excludeAccountId?: number
    placeholder?: string
}

export function AccountSelector({
    value,
    onChange,
    accounts,
    transactions,
    excludeAccountId,
    placeholder = "Select account",
}: AccountSelectorProps) {
    const options = accounts.filter((account) => account.id !== excludeAccountId)

    return (
        <Select
            onValueChange={(v) => onChange(parseInt(v))}
            value={value?.toString() || ""}
        >
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((account) => (
                    <SelectItem key={account.id} value={account.id!.toString()}>
                        <div className="flex items-center gap-2">
                            <span>{account.name}</span>
                            <span className="text-sm text-muted-foreground">
                                ({formatCents(computeAccountBalance(account, transactions))})
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
