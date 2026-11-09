import { toCsv, parseCsv } from "./csv"
import { expenseSchema } from "./validations/expense"
import type { Transaction, Account } from "./db"

// CSV export/import for transactions — this is the only backup/restore
// path for this app's local-only data (no cloud sync yet).
export const CSV_HEADER = ["date", "type", "category", "description", "amount", "account", "tags"] as const

export function transactionsToCsv(transactions: Transaction[], accounts: Account[]): string {
  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? ""

  const rows = transactions.map((t) => [
    t.date.toISOString(),
    t.type,
    t.category,
    t.description,
    t.amount.toFixed(2),
    accountName(t.accountId),
    (t.tags ?? []).join(";"),
  ])

  return toCsv([...CSV_HEADER], rows)
}

export interface ImportedTransactionRow {
  /** 1-based, counting the header as row 1 — matches what a user sees opening the file in a spreadsheet editor. */
  rowNumber: number
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
}

export interface ImportRowError {
  /** 0 for a file-level problem (empty file, bad header); otherwise the 1-based row. */
  rowNumber: number
  message: string
}

export interface ImportResult {
  rows: ImportedTransactionRow[]
  errors: ImportRowError[]
}

/**
 * Parses and validates a transactions CSV. Pure — it resolves account
 * names to accountIds against the given accounts, but does not touch
 * the database or create missing accounts/categories; the caller
 * decides what to do with `rows` and `errors` (e.g. only write `rows`
 * if `errors` is empty, or write the valid ones and report the rest).
 *
 * One bad row does not abort the whole file: each data row is
 * validated independently, so a single malformed row lands in
 * `errors` while every other valid row still lands in `rows`.
 *
 * Known limitation: this does not detect rows that duplicate
 * transactions already in the database (e.g. re-importing the same
 * export). That needs DB access and is left to the caller.
 */
export function parseTransactionsCsv(csvText: string, accounts: Account[]): ImportResult {
  const parsed = parseCsv(csvText)
  const errors: ImportRowError[] = []
  const rows: ImportedTransactionRow[] = []

  if (parsed.length === 0) {
    errors.push({ rowNumber: 0, message: "The file is empty." })
    return { rows, errors }
  }

  const header = parsed[0].map((h) => h.trim().toLowerCase())
  const expectedHeader = [...CSV_HEADER]
  const headerMatches =
    header.length === expectedHeader.length && expectedHeader.every((h, i) => h === header[i])
  if (!headerMatches) {
    errors.push({
      rowNumber: 1,
      message: `Header must be exactly: ${expectedHeader.join(", ")}`,
    })
    return { rows, errors }
  }

  for (let i = 1; i < parsed.length; i++) {
    const rowNumber = i + 1
    const fields = parsed[i]

    if (fields.length !== expectedHeader.length) {
      errors.push({
        rowNumber,
        message: `Expected ${expectedHeader.length} columns, found ${fields.length}.`,
      })
      continue
    }

    const [dateStr, typeStr, categoryStr, descriptionStr, amountStr, accountNameStr, tagsStr] = fields

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      errors.push({ rowNumber, message: `Invalid date: "${dateStr}"` })
      continue
    }

    const type = typeStr.trim().toLowerCase()
    if (type !== "expense" && type !== "income") {
      errors.push({ rowNumber, message: `Type must be "expense" or "income", got "${typeStr}"` })
      continue
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount)) {
      errors.push({ rowNumber, message: `Invalid amount: "${amountStr}"` })
      continue
    }

    const accountNameNormalized = accountNameStr.trim().toLowerCase()
    const account = accounts.find((a) => a.name.trim().toLowerCase() === accountNameNormalized)
    if (!account || account.id === undefined) {
      errors.push({ rowNumber, message: `Unknown account: "${accountNameStr}"` })
      continue
    }

    const tags = tagsStr
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean)

    const candidate = {
      date,
      type,
      category: categoryStr.trim(),
      description: descriptionStr.trim(),
      amount,
      accountId: account.id,
      tags,
    }

    const result = expenseSchema.safeParse(candidate)
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join("; ")
      errors.push({ rowNumber, message })
      continue
    }

    rows.push({
      rowNumber,
      data: {
        amount: result.data.amount!,
        type: result.data.type,
        category: result.data.category!.trim(),
        description: result.data.description ?? "",
        date: result.data.date,
        accountId: result.data.accountId!,
        tags: result.data.tags ?? [],
      },
    })
  }

  return { rows, errors }
}
