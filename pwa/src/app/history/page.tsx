"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"
import { formatCents } from "@/lib/money"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
import { Search, ChevronDown, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useDB } from "@/contexts/db-context"
import { isExpenseOrIncomeTransaction, type Transaction } from "@/lib/db"
import { isOutflow } from "@/lib/account-balance"

type TypeFilter = "all" | "expense" | "income"
type GroupBy = "month" | "category"
type SortBy = "newest" | "oldest" | "amount-desc" | "amount-asc"
type DateRangePreset = "30" | "90" | "180" | "custom"

/** Transactions with no (or blank) category land here, never dropped or merged elsewhere. */
const UNCATEGORIZED_LABEL = "Uncategorized"

function getGroupKey(transaction: Transaction, groupBy: GroupBy): string {
  if (groupBy === "month") return format(transaction.date, "yyyy-MM")
  const category = transaction.category.trim()
  return category === "" ? UNCATEGORIZED_LABEL : category
}

function getGroupLabel(key: string, groupBy: GroupBy): string {
  if (groupBy === "month") return format(new Date(`${key}-01T00:00:00`), "MMMM yyyy")
  return key
}

/**
 * Category groups sort alphabetically with "Uncategorized" always last.
 * Month groups sort chronologically; amount-based sorts don't have a
 * temporal direction, so they default to newest-month-first (matching the
 * "newest" sort), while "oldest" flips month order to oldest-first too.
 */
function sortGroupKeys(keys: string[], groupBy: GroupBy, sortBy: SortBy): string[] {
  if (groupBy === "category") {
    return [...keys].sort((a, b) => {
      if (a === UNCATEGORIZED_LABEL) return 1
      if (b === UNCATEGORIZED_LABEL) return -1
      return a.localeCompare(b)
    })
  }
  const ascending = sortBy === "oldest"
  return [...keys].sort((a, b) => {
    if (a === b) return 0
    const result = a < b ? -1 : 1
    return ascending ? result : -result
  })
}

function sortTransactions(transactions: Transaction[], sortBy: SortBy): Transaction[] {
  const sorted = [...transactions]
  switch (sortBy) {
    case "oldest":
      return sorted.sort((a, b) => a.date.getTime() - b.date.getTime())
    case "amount-desc":
      return sorted.sort((a, b) => b.amount - a.amount)
    case "amount-asc":
      return sorted.sort((a, b) => a.amount - b.amount)
    case "newest":
    default:
      return sorted.sort((a, b) => b.date.getTime() - a.date.getTime())
  }
}

/**
 * "Custom" with one or both bounds still unset is treated as unrestricted on
 * that side, rather than showing nothing the moment the user picks "Custom".
 */
function getDateRangeBounds(
  preset: DateRangePreset,
  customStart: string,
  customEnd: string,
  now: Date
): { start: Date | null; end: Date | null } {
  if (preset === "custom") {
    return {
      start: customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null,
      end: customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : null,
    }
  }
  const days = preset === "30" ? 30 : preset === "90" ? 90 : 180
  return {
    start: startOfDay(subDays(now, days - 1)),
    end: endOfDay(now),
  }
}

export default function HistoryPage() {
  const { transactions } = useDB()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [groupBy, setGroupBy] = useState<GroupBy>("month")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("30")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  // Groups whose expansion the user has explicitly flipped away from the
  // default (see isDefaultExpanded below) — keyed by group key, not index,
  // so toggling one group never disturbs another. Several groups can be
  // open at once.
  const [toggledGroups, setToggledGroups] = useState<Set<string>>(new Set())
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { type: "expense" | "income" }) | null>(null)
  const [pendingDeleteTransferId, setPendingDeleteTransferId] = useState<string | null>(null)

  const allTransactions = transactions.transactions
  const isLoading = allTransactions === undefined

  if (isLoading) return null // This will show the loading.tsx component

  const toggleGroup = (key: string) => {
    setToggledGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const query = searchQuery.trim().toLowerCase()
  const now = new Date()
  const { start: rangeStart, end: rangeEnd } = getDateRangeBounds(dateRangePreset, customStart, customEnd, now)

  const filtered = allTransactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter((t) => (!rangeStart || t.date >= rangeStart) && (!rangeEnd || t.date <= rangeEnd))
    .filter(
      (t) =>
        query === "" ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    )

  const sorted = sortTransactions(filtered, sortBy)

  // Group transactions by month or category (never dropping uncategorized ones)
  const groupedTransactions = sorted.reduce((groups, transaction) => {
    const key = getGroupKey(transaction, groupBy)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(transaction)
    return groups
  }, {} as Record<string, Transaction[]>)

  const groupKeys = sortGroupKeys(Object.keys(groupedTransactions), groupBy, sortBy)

  const hasActiveFilters =
    query !== "" || typeFilter !== "all" || dateRangePreset !== "30" || customStart !== "" || customEnd !== ""

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-2">
        <h1 className="text-2xl font-bold">Transaction History</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
                <SelectTrigger id="type-filter" aria-label="Transaction Type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="group-by">Group By</Label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                <SelectTrigger id="group-by" aria-label="Group By">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger id="sort-by" aria-label="Sort By">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
                  <SelectItem value="amount-asc">Amount: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="date-range">Date Range</Label>
              <Select
                value={dateRangePreset}
                onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}
              >
                <SelectTrigger id="date-range" aria-label="Date Range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 180 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dateRangePreset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="range-start">Start date</Label>
                <Input
                  id="range-start"
                  type="date"
                  aria-label="Start date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="range-end">End date</Label>
                <Input
                  id="range-end"
                  type="date"
                  aria-label="End date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {groupKeys.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {allTransactions.length === 0
            ? "No transactions yet."
            : hasActiveFilters
              ? "No transactions match your filters."
              : "No transactions match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {groupKeys.map((key, index) => {
            // The most recent (or, for category grouping, alphabetically
            // first) group is expanded by default; everything else starts
            // collapsed. Clicking a header flips that group's own state,
            // independent of every other group, so several can be open
            // at once.
            const isDefaultExpanded = index === 0
            const isExpanded = toggledGroups.has(key) ? !isDefaultExpanded : isDefaultExpanded
            const label = getGroupLabel(key, groupBy)

            return (
              <Card key={key}>
                <button
                  className="w-full text-left"
                  onClick={() => toggleGroup(key)}
                >
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform",
                        isExpanded ? "rotate-180" : ""
                      )}
                    />
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {groupedTransactions[key].map((transaction) => {
                        const outflow = isOutflow(transaction.type)
                        const content = (
                          <>
                            <div>
                              <p className="font-medium">
                                {transaction.description || transaction.category}
                              </p>
                              <p className="text-sm text-muted-foreground">{transaction.category}</p>
                            </div>
                            <p className={cn("font-medium", outflow ? "text-red-600" : "text-green-600")}>
                              {outflow ? '-' : '+'}
                              {formatCents(transaction.amount)}
                            </p>
                          </>
                        )

                        // A transfer leg isn't edited through the ordinary
                        // expense form (see AddExpenseForm) — it's a linked
                        // pair, not a standalone row. It can still be deleted
                        // (both legs together, see deleteTransfer).
                        if (!isExpenseOrIncomeTransaction(transaction)) {
                          return (
                            <div
                              key={transaction.id}
                              className="flex w-full items-center justify-between py-2 border-b last:border-0 px-1 -mx-1"
                            >
                              {content}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                aria-label="Delete transfer"
                                onClick={() => setPendingDeleteTransferId(transaction.transferId!)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        }

                        return (
                          <button
                            key={transaction.id}
                            type="button"
                            onClick={() => setEditingTransaction(transaction)}
                            className="flex w-full items-center justify-between py-2 border-b last:border-0 text-left hover:bg-muted/50 transition-colors rounded-sm px-1 -mx-1"
                          >
                            {content}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {editingTransaction && (
        <AddExpenseModal
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}
      <Dialog
        open={pendingDeleteTransferId !== null}
        onOpenChange={(open) => !open && setPendingDeleteTransferId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete transfer?</DialogTitle>
            <DialogDescription>
              This removes both sides of the transfer. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteTransferId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pendingDeleteTransferId) await transactions.deleteTransfer(pendingDeleteTransferId)
                setPendingDeleteTransferId(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
