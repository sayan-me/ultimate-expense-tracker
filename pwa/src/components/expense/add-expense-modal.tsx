"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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

    const defaultTrigger = (
        <Button
            size="lg"
            className={`${
                defaultType === "expense"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
            } shadow-lg`}
        >
            <Plus className="h-5 w-5 mr-2" />
            Add {defaultType}
        </Button>
    )

    const handleSuccess = () => {
        setOpen(false)
    }

    const handleCancel = () => {
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
            <DialogContent className="w-[90vw] h-[70vh] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col p-0">
                <div className="p-6 pb-0 shrink-0">
                    <DialogHeader>
                        <DialogTitle>
                            Add New{" "}
                            {currentType === "expense" ? "Expense" : "Income"}
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <AddExpenseForm
                    defaultType={defaultType}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    onTypeChange={setCurrentType}
                    className="flex-1 overflow-hidden"
                />
            </DialogContent>
        </Dialog>
    )
}
