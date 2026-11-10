import { TrendingUp, TrendingDown } from "lucide-react"
import { formatCents } from "@/lib/money"
import type { MonthlyTotal } from "@/lib/stats"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const BAR_MAX_HEIGHT_PX = 96

/**
 * Grouped bar chart, income vs expense over several months — two series,
 * so a legend is mandatory. Red/green is the classic deutan-confusable
 * pair (this app already uses it everywhere for income/expense), so
 * identity never rests on color alone here: a fixed left-right bar
 * position per month, a labeled legend with distinct icons, and an
 * accessible per-bar title carry it instead.
 */
export function MonthlyTrendChart({ months }: { months: MonthlyTotal[] }) {
  const maxValue = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 0)

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground">No activity in this period.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          Expense
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`} className="flex flex-1 flex-col items-center gap-1">
            {/* Fixed height set here, not inherited via h-full, so the
                children's percentage heights resolve against a real
                number — a percentage height of an auto-height ancestor
                computes to 0, not "percent of the nearest fixed ancestor". */}
            <div className="flex items-end gap-0.5" style={{ height: BAR_MAX_HEIGHT_PX }}>
              <div
                data-series="income"
                className="w-2.5 rounded-t-sm bg-green-600"
                style={{ height: `${(m.income / maxValue) * 100}%` }}
                title={`Income, ${MONTH_NAMES[m.month]} ${m.year}: ${formatCents(m.income)}`}
              />
              <div
                data-series="expense"
                className="w-2.5 rounded-t-sm bg-red-600"
                style={{ height: `${(m.expense / maxValue) * 100}%` }}
                title={`Expense, ${MONTH_NAMES[m.month]} ${m.year}: ${formatCents(m.expense)}`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{MONTH_NAMES[m.month]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
