"use client"

import { useState, useEffect } from "react"
import {
    BaseModal,
    BaseModalWithTrigger,
    ModalHeader
} from "@/components/ui/modal"
import { AddExpenseForm } from "./add-expense-form"

interface AddExpenseModalProps {
    defaultType?: "expense" | "income"
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddExpenseModal({
    defaultType = "expense",
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
}: AddExpenseModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [currentType, setCurrentType] = useState<"expense" | "income">(defaultType)

    // Use external control if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange || setInternalOpen

    // Reset type when modal opens
    useEffect(() => {
        if (open) {
            setCurrentType(defaultType)
        }
    }, [open, defaultType])


    const handleSuccess = () => {
        setOpen(false)
    }

    const handleCancel = () => {
        setOpen(false)
    }

    if (trigger) {
        return (
            <BaseModalWithTrigger
                trigger={trigger}
                open={open}
                onOpenChange={setOpen}
                size="md"
            >
                <ModalHeader
                    title={`Add New ${currentType === "expense" ? "Expense" : "Income"}`}
                />
                <AddExpenseForm
                    defaultType={defaultType}
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
            <ModalHeader
                title={`Add New ${currentType === "expense" ? "Expense" : "Income"}`}
            />
            <AddExpenseForm
                defaultType={defaultType}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                onTypeChange={setCurrentType}
                className="flex-1 overflow-hidden"
            />
        </BaseModal>
    )
}
