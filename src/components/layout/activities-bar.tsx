"use client"

import { cn } from "@/lib/utils"
import { 
  GripHorizontal, Receipt, BarChart3, Bell, Wallet, FileText,
  PiggyBank, Award, Target, Clock, Tags, FileUp, FileDown,
  Users, Settings, SplitSquareHorizontal, Activity, Plus, Minus,
  History
} from "lucide-react"
import { ActivitiesBarHeader } from "./activities-bar-header"
import { Overlay } from "@/components/ui/overlay"
import { useActivities } from "@/contexts/activities-context"

type ActivityItem = {
  icon: typeof Receipt
  label: string
  onClick: () => void
}

export const PERSONAL_ACTIVITIES: ActivityItem[] = [
  { icon: Receipt, label: "Log Transactions", onClick: () => {} },
  { icon: BarChart3, label: "View Stats", onClick: () => {} },
  { icon: PiggyBank, label: "Set Budget", onClick: () => {} },
  { icon: Bell, label: "Notifications", onClick: () => {} },
  { icon: Wallet, label: "Manage Virtual Accounts", onClick: () => {} },
  { icon: FileText, label: "View Loan Accounts", onClick: () => {} },
  { icon: FileUp, label: "Analyze Bank Statement", onClick: () => {} },
  { icon: Award, label: "View Awards & Achievements", onClick: () => {} },
  { icon: Target, label: "Manage Goals", onClick: () => {} },
  { icon: Clock, label: "Manage Recurring Expenses", onClick: () => {} },
  { icon: Tags, label: "Create/Edit Categories", onClick: () => {} },
  { icon: FileDown, label: "Export/Import Data", onClick: () => {} },
  { icon: History, label: "View Budget History", onClick: () => {} },
]

export const GROUP_ACTIVITIES: ActivityItem[] = [
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
  const { 
    isActivitiesBarOpen, 
    isCustomizing,
    selectedQuickActions,
    isGroupMode,
    actions,
    toggleActivitiesBar,
    toggleQuickAction,
    closeActivitiesBar 
  } = useActivities()

  const handleClose = () => {
    closeActivitiesBar()
  }

  return (
    <>
      <Overlay isVisible={isActivitiesBarOpen} onClose={handleClose} />
      <div
        className={cn(
          "fixed bottom-14 left-0 right-0 bg-background transition-transform duration-300 ease-in-out",
          "border-t rounded-t-2xl shadow-lg",
          isActivitiesBarOpen ? "h-[50vh] transform translate-y-0" : "h-12 transform translate-y-0"
        )}
      >
        {isCustomizing ? (
          <>
            <ActivitiesBarHeader 
              title={`Customize ${isGroupMode ? 'Group' : 'Personal'} Quick Actions`}
              onClose={handleClose} 
            />
            <div className="h-[calc(50vh-4rem)] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 p-4">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => toggleQuickAction(action)}
                    className={cn(
                      "relative flex flex-col items-center p-3 rounded-full transition-all",
                      selectedQuickActions.some(a => a.label === action.label)
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "border-2 border-dashed border-muted hover:border-primary/50"
                    )}
                    aria-label={`${selectedQuickActions.some(a => a.label === action.label) ? 'Remove' : 'Add'} ${action.label}`}
                  >
                    {selectedQuickActions.some(a => a.label === action.label) ? (
                      <Minus className="absolute top-1 right-1 h-4 w-4" />
                    ) : (
                      <Plus className="absolute top-1 right-1 h-3 w-3" />
                    )}
                    <div className="rounded-full p-3">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-center mt-1">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => toggleActivitiesBar()}
              className="flex w-full items-center justify-center p-2 gap-2"
              aria-label={isActivitiesBarOpen ? "Collapse activities" : "Expand activities"}
            >
              <span className="text-sm text-muted-foreground">
                {isGroupMode ? 'Group Activities' : 'Activities'}
              </span>
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
            {isActivitiesBarOpen && (
              <div className="container h-full overflow-y-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {actions.map((activity) => (
                    <ActivityButton key={activity.label} {...activity} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
} 