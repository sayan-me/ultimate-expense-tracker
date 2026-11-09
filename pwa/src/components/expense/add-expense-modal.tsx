"use client"

import { useState, useEffect } from "react"
import {
    BaseModal,
    BaseModalWithTrigger,
    ModalHeader
} from "@/components/ui/modal"
import { AddExpenseForm } from "./add-expense-form"
import type { Transaction } from "@/lib/db"

interface AddExpenseModalProps {
    defaultType?: "expense" | "income"
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /**
     * When set, the modal edits this existing transaction instead of
     * creating a new one. Never a transfer leg — see AddExpenseForm.
     */
    transaction?: Transaction & { type: "expense" | "income" }
}

export function AddExpenseModal({
    defaultType = "expense",
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    transaction,
}: AddExpenseModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [currentType, setCurrentType] = useState<"expense" | "income">(transaction?.type ?? defaultType)
    const isEditing = !!transaction

    // Use external control if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange || setInternalOpen

    // Reset type when modal opens
    useEffect(() => {
        if (open) {
            setCurrentType(transaction?.type ?? defaultType)
        }
    }, [open, defaultType, transaction])


    const handleSuccess = () => {
        setOpen(false)
    }

    const handleCancel = () => {
        setOpen(false)
    }

    const title = isEditing
        ? `Edit ${currentType === "expense" ? "Expense" : "Income"}`
        : `Add New ${currentType === "expense" ? "Expense" : "Income"}`

    if (trigger) {
        return (
            <BaseModalWithTrigger
                trigger={trigger}
                open={open}
                onOpenChange={setOpen}
                size="md"
            >
                <ModalHeader title={title} />
                <AddExpenseForm
                    defaultType={defaultType}
                    transaction={transaction}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    onTypeChange={setCurrentType}
                    className="flex-1 overflow-hidden"
                />
            </BaseModalWithTrigger>
        )
    }

    return (
        <BaseModal open={open} onOpenChange={setOpen} size="md">
            <ModalHeader title={title} />
            <AddExpenseForm
                defaultType={defaultType}
                transaction={transaction}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                onTypeChange={setCurrentType}
                className="flex-1 overflow-hidden"
            />
        </BaseModal>
    )
}
