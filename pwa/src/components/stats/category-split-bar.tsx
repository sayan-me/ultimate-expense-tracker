import { formatCents } from "@/lib/money"
import type { CategoryBreakdownEntry } from "@/lib/stats"

/**
 * One whole (the month's expenses) split into parts, read beside its own
 * figures — dataviz skill's "thin segmented bar, no text" pattern: a single
 * 8px bar with no text on it, followed by a legend-as-table where each row's
 * own swatch stands in for a legend box. Color is never the only identity
 * signal — every row names its category directly.
 */
export function CategorySplitBar({ entries }: { entries: CategoryBreakdownEntry[] }) {
  const total = entries.reduce((sum, e) => sum + e.amount, 0)

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No expenses this month.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Spending split by category">
        {entries.map((entry) => (
          <div
            key={entry.category}
            data-segment
            className="h-full"
            style={{ width: `${(entry.amount / total) * 100}%`, backgroundColor: entry.color }}
            title={`${entry.category}: ${formatCents(entry.amount)}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.category} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{Math.round((entry.amount / total) * 100)}%</span>
              <span className="font-medium tabular-nums">{formatCents(entry.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
