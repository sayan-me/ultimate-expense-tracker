"use client"
// Add ESLint disable for planned features
/* eslint-disable @typescript-eslint/no-unused-vars */
import { cn } from "@/lib/utils"
import { 
  Receipt, PiggyBank, BarChart3, Bell, 
  Wallet, Target, FileUp, Award, FileDown,
  Plus
} from "lucide-react"
import { useState } from "react"

type QuickAction = {
  icon: typeof Receipt
  label: string
  onClick: () => void
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { icon: Receipt, label: "Log Transactions", onClick: () => {} },
  { icon: PiggyBank, label: "Set Budget", onClick: () => {} },
  { icon: BarChart3, label: "View Stats", onClick: () => {} },
  { icon: Bell, label: "Notifications", onClick: () => {} },
  { icon: Wallet, label: "Add Virtual Account", onClick: () => {} },
  { icon: Target, label: "Add Savings Goal", onClick: () => {} },
  { icon: FileUp, label: "Import Bank Statement", onClick: () => {} },
  { icon: Award, label: "View Awards", onClick: () => {} },
  { icon: FileDown, label: "Export Reports", onClick: () => {} },
]

const QuickActionButton = ({ icon: Icon, label, onClick }: QuickAction) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
    aria-label={label}
  >
    <div className="rounded-full bg-primary/10 p-3">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <span className="text-xs text-center">{label}</span>
  </button>
)

export function QuickActions() {
  const [actions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS)
  const [isManaging, setIsManaging] = useState(false)
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const handleManageShortcuts = () => {
    setIsManaging(true)
    // This will trigger the Activities bar to open with the full list
  }

  return (
    <section className="py-4" aria-label="Quick actions">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <button
          onClick={handleManageShortcuts}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Customize quick actions"
        >
          Customize
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action) => (
          <QuickActionButton key={action.label} {...action} />
        ))}
      </div>
    </section>
  )
} 