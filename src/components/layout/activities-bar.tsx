"use client"

import { cn } from "@/lib/utils"
import { 
  GripHorizontal, Receipt, BarChart3, Bell, Wallet, FileText,
  PiggyBank, Award, Target, Clock, Tags, FileUp, FileDown,
  Users, Settings, SplitSquareHorizontal, Activity
} from "lucide-react"
import { useState } from "react"

type ActivityItem = {
  icon: typeof Receipt
  label: string
  onClick: () => void
}

const PERSONAL_ACTIVITIES: ActivityItem[] = [
  { icon: Receipt, label: "Log Transactions", onClick: () => {} },
  { icon: BarChart3, label: "View Stats", onClick: () => {} },
  { icon: PiggyBank, label: "Set Budget", onClick: () => {} },
  { icon: Bell, label: "Notifications", onClick: () => {} },
  { icon: Wallet, label: "Manage Virtual Accounts", onClick: () => {} },
  { icon: FileText, label: "View Loan Accounts", onClick: () => {} },
  { icon: FileUp, label: "Analyze Bank Statement", onClick: () => {} },
  { icon: Award, label: "View Awards", onClick: () => {} },
  { icon: Target, label: "Manage Goals", onClick: () => {} },
  { icon: Clock, label: "Manage Recurring Expenses", onClick: () => {} },
  { icon: Tags, label: "Manage Categories", onClick: () => {} },
  { icon: FileDown, label: "Export/Import Data", onClick: () => {} },
]

const GROUP_ACTIVITIES: ActivityItem[] = [
  { icon: Receipt, label: "Log Group Transactions", onClick: () => {} },
  { icon: BarChart3, label: "View Group Stats", onClick: () => {} },
  { icon: Settings, label: "Manage Group Settings", onClick: () => {} },
  { icon: PiggyBank, label: "Set Group Budget", onClick: () => {} },
  { icon: Bell, label: "Notifications", onClick: () => {} },
  { icon: FileText, label: "Generate Reports", onClick: () => {} },
  { icon: SplitSquareHorizontal, label: "Settle Balances", onClick: () => {} },
  { icon: Activity, label: "View Split History", onClick: () => {} },
  { icon: Users, label: "Manage Split Requests", onClick: () => {} },
  { icon: FileDown, label: "Export Group Data", onClick: () => {} },
  { icon: Activity, label: "View Group Activity", onClick: () => {} },
  { icon: Tags, label: "Manage Group Categories", onClick: () => {} },
]

const ActivityButton = ({ icon: Icon, label, onClick }: ActivityItem) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-lg p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    aria-label={label}
  >
    <Icon className="h-6 w-6" />
    <span className="text-xs text-center">{label}</span>
  </button>
)

export function ActivitiesBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeMode] = useState<'personal' | 'group'>('personal')

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const activities = activeMode === 'personal' ? PERSONAL_ACTIVITIES : GROUP_ACTIVITIES

  return (
    <div 
      className={cn(
        "fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur transition-all duration-300 border-t",
        isExpanded ? "h-[50vh]" : "h-8"
      )}
    >
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-center p-2 gap-2"
        aria-label={isExpanded ? "Collapse activities" : "Expand activities"}
      >
        <span className="text-sm text-muted-foreground">Activities</span>
        <GripHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>
      {isExpanded && (
        <div className="container h-full overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {activities.map((activity) => (
              <ActivityButton key={activity.label} {...activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 