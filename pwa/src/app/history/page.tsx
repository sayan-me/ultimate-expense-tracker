"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddExpenseModal } from "@/components/expense/add-expense-modal"
import { formatCents } from "@/lib/money"
import { format } from "date-fns"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useDB } from "@/contexts/db-context"
import type { Transaction } from "@/lib/db"

type TypeFilter = "all" | "expense" | "income"

export default function HistoryPage() {
  const { transactions } = useDB()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const allTransactions = transactions.transactions
  const isLoading = allTransactions === undefined

  if (isLoading) return null // This will show the loading.tsx component

  const query = searchQuery.trim().toLowerCase()
  const filtered = allTransactions
    .filter((t) => typeFilter === "all" || t.type === typeFilter)
    .filter(
      (t) =>
        query === "" ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  // Group transactions by date
  const groupedTransactions = filtered.reduce((groups, transaction) => {
    const date = format(transaction.date, 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, Transaction[]>)

  const groupDates = Object.keys(groupedTransactions).sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="py-6">
      {/* flex-col below sm: the title, search input and filter button
          competing for one row left the search placeholder clipped to
          "Search tra…" and forced the title onto two lines (M4 in the
          bug report). The title gets its own row; search gets the
          full remaining width on the row below it. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-2">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-md border px-3 py-2 shrink-0">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Transaction type</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as TypeFilter)}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="expense">Expense</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="income">Income</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {groupDates.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {allTransactions.length === 0
            ? "No transactions yet."
            : "No transactions match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {groupDates.map((date) => (
            <Card key={date}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedDate(expandedDate === date ? null : date)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(new Date(`${date}T00:00:00`), 'MMMM d, yyyy')}
                  </CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      expandedDate === date ? "rotate-180" : ""
                    )}
                  />
                </CardHeader>
              </button>
              {expandedDate === date && (
                <CardContent>
                  <div className="space-y-4">
                    {groupedTransactions[date].map((transaction) => (
                      <button
                        key={transaction.id}
                        type="button"
                        onClick={() => setEditingTransaction(transaction)}
                        className="flex w-full items-center justify-between py-2 border-b last:border-0 text-left hover:bg-muted/50 transition-colors rounded-sm px-1 -mx-1"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.description || transaction.category}
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.category}</p>
                        </div>
                        <p className={cn(
                          "font-medium",
                          transaction.type === 'income' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCents(transaction.amount)}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {editingTransaction && (
        <AddExpenseModal
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}
    </div>
  )
}
