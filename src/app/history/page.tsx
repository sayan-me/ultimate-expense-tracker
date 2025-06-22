"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getTransactionHistory } from "@/lib/data"

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  category: string
  type: 'expense' | 'income'
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactionHistory()
        setTransactions(data.transactions)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load transactions'))
      } finally {
        setIsLoading(false)
      }
    }
    loadTransactions()
  }, [])

  if (error) throw error // This will be caught by the error boundary
  if (isLoading) return null // This will show the loading.tsx component

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = format(new Date(transaction.date), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <button className="flex items-center gap-1 rounded-md border px-3 py-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <Card key={date}>
            <button
              className="w-full text-left"
              onClick={() => setExpandedDate(expandedDate === date ? null : date)}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  {format(new Date(date), 'MMMM d, yyyy')}
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
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                      </div>
                      <p className={cn(
                        "font-medium",
                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
} 