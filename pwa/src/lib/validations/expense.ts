import { z } from "zod"

/**
 * Validation schema for expense/income transactions
 */
export const expenseSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number"
    })
    .positive("Amount must be positive")
    .max(1000000, "Amount cannot exceed 1,000,000")
    .optional()
    .refine((val) => val !== undefined && val > 0, {
      message: "Amount is required and must be positive"
    }),
  
  type: z.enum(["expense", "income"], {
    required_error: "Transaction type is required"
  }),
  
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category name too long")
    .optional()
    .refine((val) => val && val.trim().length > 0, {
      message: "Category is required"
    }),
  
  description: z
    .string()
    .max(200, "Description too long")
    .optional(),
  
  accountId: z
    .number({
      required_error: "Account is required",
      invalid_type_error: "Invalid account selection"
    })
    .int("Invalid account ID")
    .positive("Invalid account ID")
    .optional()
    .refine((val) => val !== undefined && val > 0, {
      message: "Please select an account"
    }),
  
  date: z
    .date({
      required_error: "Date is required",
      invalid_type_error: "Invalid date"
    })
    .refine((date) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Allow today until end of day
      return date <= today;
    }, {
      message: "Date cannot be in the future"
    }),
  
  tags: z
    .array(z.string().max(30, "Tag name too long"))
    .optional()
    .default([])
})

/**
 * Type for the expense form data
 */
export type ExpenseFormData = z.infer<typeof expenseSchema>

/**
 * Validation schema for quick expense entry (minimal fields)
 */
export const quickExpenseSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount cannot exceed 1,000,000"),
  
  category: z
    .string()
    .min(1, "Category is required"),
  
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description too long"),
})

/**
 * Type for quick expense form data
 */
export type QuickExpenseFormData = z.infer<typeof quickExpenseSchema>

/**
 * Transform string amount to number for form processing
 */
export const parseAmountString = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[^\d.-]/g, '') // Remove non-numeric chars except decimal and minus
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed)) {
    throw new Error("Invalid amount format")
  }
  
  return Math.round(parsed * 100) / 100 // Round to 2 decimal places
}

/**
 * Format amount for display
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}