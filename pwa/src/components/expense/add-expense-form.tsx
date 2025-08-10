"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tags } from "lucide-react"
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
import { useDB } from "@/contexts/db-context"
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense"
import { CategorySelector } from "./category-selector"
import { TagsInput } from "./tags-input"
import { ModalFixedSection, ModalScrollableContent, ModalFooter } from "@/components/ui/modal"
import { cn } from "@/lib/utils"

interface AddExpenseFormProps {
    onSuccess?: () => void
    onCancel?: () => void
    defaultType?: "expense" | "income"
    onTypeChange?: (type: "expense" | "income") => void
    className?: string
}

export function AddExpenseForm({
    onSuccess,
    onCancel,
    defaultType = "expense",
    onTypeChange,
    className,
}: AddExpenseFormProps) {
    const { transactions, accounts } = useDB()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        mode: "onSubmit", // Only validate on submit, not on change
        reValidateMode: "onChange", // Re-validate after first submit attempt
        defaultValues: {
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
                amount: data.amount!, // Now guaranteed to be defined by validation
                accountId: data.accountId!, // Now guaranteed to be defined by validation
                category: data.category!.trim(), // Now guaranteed to be defined by validation
                description: data.description!.trim(), // Now guaranteed to be defined by validation
            }
            
            await transactions.addTransaction(transactionData)

            // Update account balance
            const account = await accounts.accounts?.find(
                (acc) => acc.id === transactionData.accountId
            )
            if (account) {
                const balanceChange =
                    transactionData.type === "income" ? transactionData.amount : -transactionData.amount
                await accounts.updateAccount(transactionData.accountId, {
                    balance: account.balance + balanceChange,
                })
            }

            form.reset()
            onSuccess?.()
        } catch (error) {
            console.error("Failed to add transaction:", error)
            // TODO: Add toast notification for error
        } finally {
            setIsSubmitting(false)
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
                                                        const inputValue = e.target.value
                                                        if (inputValue === "") {
                                                            field.onChange(undefined)
                                                        } else {
                                                            const value = parseFloat(inputValue)
                                                            field.onChange(isNaN(value) ? undefined : value)
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
                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account *</FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(parseInt(value))
                                            }
                                            value={field.value?.toString() || ""}
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
                                                                    ($
                                                                    {account.balance.toFixed(
                                                                        2
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
                                    <FormLabel>Description *</FormLabel>
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
                                                    const date = e.target
                                                        .value
                                                        ? new Date(
                                                              e.target.value
                                                          )
                                                        : new Date()
                                                    field.onChange(date)
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
                                    ? "Adding..."
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
                        </div>
                    </ModalFooter>
                </form>
            </Form>
        </div>
    )
}
