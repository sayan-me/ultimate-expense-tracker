"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Plus, Tags } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDB } from "@/contexts/db-context"
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense"
import { CategorySelector } from "./category-selector"
import { TagsInput } from "./tags-input"

interface AddExpenseFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultType?: "expense" | "income"
}

export function AddExpenseForm({ onSuccess, onCancel, defaultType = "expense" }: AddExpenseFormProps) {
  const { transactions, accounts } = useDB()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: defaultType,
      date: new Date(),
      tags: [],
      amount: 0,
      category: "",
      description: "",
      accountId: 0
    }
  })

  const watchedType = form.watch("type")

  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      await transactions.addTransaction(data)
      
      // Update account balance
      const account = await accounts.accounts?.find(acc => acc.id === data.accountId)
      if (account) {
        const balanceChange = data.type === "income" ? data.amount : -data.amount
        await accounts.updateAccount(data.accountId, {
          balance: account.balance + balanceChange
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add {watchedType === "expense" ? "Expense" : "Income"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Transaction Type Tabs */}
            <Tabs 
              value={watchedType} 
              onValueChange={(value) => form.setValue("type", value as "expense" | "income")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense" className="text-red-600 data-[state=active]:bg-red-50">
                  Expense
                </TabsTrigger>
                <TabsTrigger value="income" className="text-green-600 data-[state=active]:bg-green-50">
                  Income
                </TabsTrigger>
              </TabsList>
            </Tabs>

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
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            field.onChange(value)
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
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id!.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{account.name}</span>
                              <span className="text-sm text-muted-foreground">
                                (${account.balance.toFixed(2)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
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
                      value={field.value}
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
                      <div className="relative">
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date()
                            field.onChange(date)
                          }}
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
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

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex-1 ${
                  watchedType === "expense" 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Adding..." : `Add ${watchedType}`}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}