"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tags, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { useDB } from "@/contexts/db-context"
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense"
import { dollarsToCents, centsToDollars, formatCents } from "@/lib/money"
import { computeAccountBalance } from "@/lib/account-balance"
import type { Transaction } from "@/lib/db"
import { CategorySelector } from "./category-selector"
import { TagsInput } from "./tags-input"
import {
    ModalFixedSection,
    ModalScrollableContent,
    ModalFooter,
} from "@/components/ui/modal"
import { cn } from "@/lib/utils"

interface AddExpenseFormProps {
    onSuccess?: () => void
    onCancel?: () => void
    defaultType?: "expense" | "income"
    onTypeChange?: (type: "expense" | "income") => void
    className?: string
    /** When set, the form edits this existing transaction instead of creating a new one. */
    transaction?: Transaction
}

export function AddExpenseForm({
    onSuccess,
    onCancel,
    defaultType = "expense",
    onTypeChange,
    className,
    transaction,
}: AddExpenseFormProps) {
    const { transactions, accounts } = useDB()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const isEditing = !!transaction

    const form = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        mode: "onSubmit", // Only validate on submit, not on change
        reValidateMode: "onChange", // Re-validate after first submit attempt
        defaultValues: transaction
            ? {
                  type: transaction.type,
                  // The form works in dollars (what a human types); the
                  // stored transaction amount is cents — see lib/money.ts.
                  amount: centsToDollars(transaction.amount),
                  category: transaction.category,
                  description: transaction.description,
                  accountId: transaction.accountId,
                  date: transaction.date,
                  tags: transaction.tags || [],
              }
            : {
                  type: defaultType,
                  date: new Date(),
                  tags: [],
                  // Remove pre-filled values that interfere with UX
                  // amount: undefined, // Let user start fresh
                  // category: "", // Let placeholder show through
                  // description: "", // Let placeholder show through
                  // accountId: undefined, // Will be set by user selection
              },
    })

    const watchedType = form.watch("type")

    const handleSubmit = async (data: ExpenseFormData) => {
        setIsSubmitting(true)
        try {
            // Ensure all required fields are properly typed for database insertion
            const transactionData = {
                ...data,
                // The form validates dollars; the stored amount is cents.
                amount: dollarsToCents(data.amount!), // Now guaranteed to be defined by validation
                accountId: data.accountId!, // Now guaranteed to be defined by validation
                category: data.category!.trim(), // Now guaranteed to be defined by validation
                description: data.description?.trim() || "", // Optional field
            }

            if (isEditing && transaction?.id !== undefined) {
                await transactions.updateTransaction(transaction.id, transactionData)
            } else {
                await transactions.addTransaction(transactionData)
            }

            form.reset()
            onSuccess?.()
        } catch (error) {
            console.error("Failed to save transaction:", error)
            // TODO: Add toast notification for error
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (transaction?.id === undefined) return
        setIsDeleting(true)
        try {
            await transactions.deleteTransaction(transaction.id)
            setShowDeleteConfirm(false)
            onSuccess?.()
        } catch (error) {
            console.error("Failed to delete transaction:", error)
            // TODO: Add toast notification for error
        } finally {
            setIsDeleting(false)
        }
    }

    // Amount change handler removed as it's not currently used
    // TODO: Implement currency formatting if needed

    return (
        <div className={cn("flex flex-col h-full min-h-0", className)}>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col h-full min-h-0"
                >
                    {/* Fixed Transaction Type Tabs */}
                    <ModalFixedSection>
                        <Tabs
                            value={watchedType}
                            onValueChange={(value) => {
                                const newType = value as "expense" | "income"
                                form.setValue("type", newType)
                                onTypeChange?.(newType)
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger
                                    value="expense"
                                    className="text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-red-700 dark:data-[state=active]:text-white"
                                >
                                    Expense
                                </TabsTrigger>
                                <TabsTrigger
                                    value="income"
                                    className="text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-700 dark:data-[state=active]:text-white"
                                >
                                    Income
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </ModalFixedSection>

                    {/* Scrollable Form Fields */}
                    <ModalScrollableContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Amount */}
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                                    $
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="1000000"
                                                    placeholder="Enter amount..."
                                                    className="pl-8"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => {
                                                        const inputValue =
                                                            e.target.value
                                                        if (inputValue === "") {
                                                            field.onChange(
                                                                undefined
                                                            )
                                                        } else {
                                                            const value =
                                                                parseFloat(
                                                                    inputValue
                                                                )
                                                            field.onChange(
                                                                isNaN(value)
                                                                    ? undefined
                                                                    : value
                                                            )
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Account */}
                            {/* TODO: Account selector should be a separate component just like Category selector and should be imported here */}
                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account *</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(parseInt(value))
                                                // The zod resolver only
                                                // re-validates a field once
                                                // it has already errored;
                                                // trigger it explicitly so
                                                // the label clears as soon
                                                // as a value is picked
                                                // (U3 in the bug report).
                                                form.trigger("accountId")
                                            }}
                                            value={
                                                field.value?.toString() || ""
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.accounts?.map(
                                                    (account) => (
                                                        <SelectItem
                                                            key={account.id}
                                                            value={account.id!.toString()}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span>
                                                                    {
                                                                        account.name
                                                                    }
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    (
                                                                    {formatCents(
                                                                        computeAccountBalance(
                                                                            account,
                                                                            transactions.transactions ?? []
                                                                        )
                                                                    )}
                                                                    )
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Category */}
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category *</FormLabel>
                                    <FormControl>
                                        <CategorySelector
                                            type={watchedType}
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={`What was this ${watchedType} for?`}
                                            maxLength={200}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date */}
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date *</FormLabel>
                                        <FormControl>
                                            {/* FormControl (a Radix Slot)
                                                merges its id/aria-* props
                                                onto its one direct child —
                                                it must be the Input itself,
                                                not a wrapping div, or the
                                                label ends up pointing at
                                                nothing (A2 in the bug
                                                report). The pr-16 below was
                                                also removed: it pushed the
                                                native calendar icon 64px in
                                                from the edge for no reason
                                                (M7) — the default padding
                                                already clears it. */}
                                            <Input
                                                type="datetime-local"
                                                {...field}
                                                value={
                                                    field.value
                                                        ? format(
                                                              field.value,
                                                              "yyyy-MM-dd'T'HH:mm"
                                                          )
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    // A native datetime-local
                                                    // picker can fire onChange
                                                    // with an empty value
                                                    // mid-edit — e.g. while
                                                    // only the day segment has
                                                    // been changed and the
                                                    // picker hasn't recomposed
                                                    // the full string yet.
                                                    // Falling back to
                                                    // new Date() here replaced
                                                    // the whole value
                                                    // (including the time)
                                                    // with the current moment
                                                    // (U7 in the bug report).
                                                    // Ignoring the empty,
                                                    // incomplete event instead
                                                    // keeps the prior value
                                                    // until a real one arrives.
                                                    if (!e.target.value) return
                                                    field.onChange(
                                                        new Date(
                                                            e.target.value
                                                        )
                                                    )
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Tags */}
                            <FormField
                                control={form.control}
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <Tags className="h-4 w-4" />
                                            Tags (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <TagsInput
                                                value={field.value || []}
                                                onChange={field.onChange}
                                                placeholder="Add tags..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </ModalScrollableContent>

                    {/* Fixed Submit Buttons */}
                    <ModalFooter>
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex-1 ${
                                    watchedType === "expense"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isSubmitting
                                    ? isEditing
                                        ? "Saving..."
                                        : "Adding..."
                                    : isEditing
                                      ? "Save changes"
                                      : `Add ${watchedType}`}
                            </Button>
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                            )}
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    aria-label="Delete transaction"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </ModalFooter>
                </form>
            </Form>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete transaction?</DialogTitle>
                        <DialogDescription>
                            This can&apos;t be undone. The account balance will be
                            updated to reflect the removal.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
