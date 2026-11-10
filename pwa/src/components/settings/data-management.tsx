"use client"

import { useState } from "react"
import { useDB } from "@/contexts/db-context"
import { transactionsToCsv, parseTransactionsCsv, type ImportResult } from "@/lib/csv-transactions"
import { Button } from "@/components/ui/button"

/**
 * CSV export/import — this is the only backup/restore path for this
 * app's local-only data (no cloud sync yet, per the roadmap).
 */
export function DataManagement() {
  const { transactions, accounts } = useDB()
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<string | null>(null)

  const handleExport = () => {
    if (!transactions.transactions || !accounts.accounts) return
    const csv = transactionsToCsv(transactions.transactions, accounts.accounts)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const today = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `ultimate-expense-tracker-${today}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset the input immediately so selecting the same file again
    // (e.g. after fixing it externally) still fires a change event.
    e.target.value = ""
    if (!file || !accounts.accounts) return

    // FileReader rather than File.text(): broader support, and it's
    // what jsdom's test environment actually implements.
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ""))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })

    setImportSummary(null)
    setImportResult(parseTransactionsCsv(text, accounts.accounts))
  }

  const handleConfirmImport = async () => {
    if (!importResult) return
    setIsImporting(true)
    try {
      for (const row of importResult.rows) {
        await transactions.addTransaction(row.data)
      }
      const count = importResult.rows.length
      setImportSummary(`Imported ${count} transaction${count === 1 ? "" : "s"}.`)
      setImportResult(null)
    } finally {
      setIsImporting(false)
    }
  }

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Export</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Download all your transactions as a CSV file — this is currently the only backup for your data.
        </p>
        <Button onClick={handleExport} disabled={!transactions.transactions?.length}>
          Export CSV
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Import</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Import transactions from a CSV file in the same format as the export.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="text-sm"
          aria-label="Choose CSV file to import"
        />
      </div>

      {importResult && (
        <div className="rounded-md border p-4 space-y-3">
          <p className="text-sm">
            {plural(importResult.rows.length, "row")} ready to import
            {importResult.errors.length > 0 &&
              `, ${plural(importResult.errors.length, "row")} skipped due to errors`}
            .
          </p>
          {importResult.errors.length > 0 && (
            <ul className="text-xs text-destructive space-y-1 max-h-40 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <li key={i}>
                  Row {err.rowNumber}: {err.message}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            {importResult.rows.length > 0 && (
              <Button size="sm" onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? "Importing..." : `Import ${plural(importResult.rows.length, "transaction")}`}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setImportResult(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {importSummary && <p className="text-sm text-green-600">{importSummary}</p>}
    </div>
  )
}
