"use client"

import { formatAmount } from "@/lib/validations/expense"
import { Skeleton } from "@/components/ui/skeleton"
import { useDB } from "@/contexts/db-context"
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CurrentBalance() {
  const { accounts, transactions } = useDB()
  const [showBalance, setShowBalance] = useState(true)

  if (!accounts.accounts || !transactions.transactions) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <Skeleton className="h-4 w-24" data-testid="skeleton-title" />
        <Skeleton className="mt-2 h-8 w-32" data-testid="skeleton-balance" />
        <div className="mt-4">
          <Skeleton className="h-4 w-28" data-testid="skeleton-subtitle" />
        </div>
      </div>
    )
  }

  // Calculate total balance from all accounts
  const totalBalance = accounts.accounts.reduce((sum, account) => sum + account.balance, 0)
  
  // Calculate this month's income and expenses
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthTransactions = transactions.transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear
  })
  
  const monthlyIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const monthlyExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netChange = monthlyIncome - monthlyExpenses
  const isPositive = netChange >= 0

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Total Balance</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
          className="h-auto p-1 text-muted-foreground hover:text-foreground"
        >
          {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="mt-2">
        {showBalance ? (
          <p className="text-3xl font-bold">{formatAmount(totalBalance)}</p>
        ) : (
          <p className="text-3xl font-bold">••••••</p>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">This month&apos;s change</span>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {showBalance ? (
                `${isPositive ? '+' : ''}${formatAmount(netChange)}`
              ) : (
                '••••'
              )}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Across {accounts.accounts.length} account{accounts.accounts.length !== 1 ? 's' : ''}</span>
          <span>{transactions.transactions.length} transaction{transactions.transactions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
} 