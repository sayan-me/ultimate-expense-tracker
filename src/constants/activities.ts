import { 
  Receipt, BarChart3, Bell, Wallet, FileText,
  PiggyBank, Award, Target, Clock, Tags, FileUp, FileDown,
  Users, Settings, SplitSquareHorizontal, Activity,
  History
} from "lucide-react"
import { LucideIcon } from "lucide-react"

export type ActivityItem = {
  icon: LucideIcon
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