import { z } from "zod"
import { usePreferencesStore } from "@/stores/preferences"
import { getCurrencyFormatter } from "@/lib/money"

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
    })
    .refine((date) => date.getFullYear() >= 1900, {
      // Catches a missing-digit year typo (e.g. "0026" for "2026") — the
      // date picker otherwise accepts it silently, and the resulting
      // transaction then disagrees with dashboard totals that filter/sort
      // by date (A1 in the real-user test report).
      message: "That year doesn't look right — did you mean a more recent date?"
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
 * Format amount for display, using the active currency from the
 * preferences store (read directly via `.getState()`, not the hook, since
 * this is a plain utility called from Zod validation, not a component).
 * See formatCents() in lib/money.ts, which shares this currency-formatting
 * approach and its Intl.NumberFormat cache.
 */
export const formatAmount = (amount: number): string => {
  const { currency } = usePreferencesStore.getState()
  return getCurrencyFormatter(currency).format(amount)
}