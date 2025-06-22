"use client"

import { Settings } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { LucideIcon } from "lucide-react"
import { FeatureGate } from "@/components/auth/feature-gate"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthFallbackContent } from "@/components/ui/auth-fallback-content"

type QuickAction = {
  icon: LucideIcon
  label: string
  onClick: () => void
  isSelected?: boolean
}

const QuickActionButton = ({ icon: Icon, label, onClick }: QuickAction) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300"
    aria-label={label}
  >
    <div className="rounded-full p-3">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <span className="text-xs text-center">{label}</span>
  </button>
)

export function QuickActions() {
  const { isGroupMode } = useActivities()

  return isGroupMode ? (
    <FeatureGate
      level="registered"
      fallback={
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Group Quick Actions</CardTitle>
          </CardHeader>
          <AuthFallbackContent type="registered" />
        </Card>
      }
    >
      <QuickActionsContent />
    </FeatureGate>
  ) : (
    <QuickActionsContent />
  )
}

function QuickActionsContent() {
  const { 
    selectedQuickActions, 
    toggleCustomizationMode,
    toggleActivitiesBar
  } = useActivities()

  const handleManageShortcuts = () => {
    toggleCustomizationMode(true)
    toggleActivitiesBar(true)
  }

  return (
    <section className="py-4" aria-label="Quick actions">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <button
          onClick={handleManageShortcuts}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Customize quick actions"
        >
          <Settings className="h-4 w-4" />
          <span>Customize</span>
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {selectedQuickActions.map((action) => (
          <QuickActionButton key={action.label} {...action} />
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 9 - selectedQuickActions.length) }).map((_, i) => (
          <div 
            key={`empty-${i}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-full border-2 border-dashed border-muted"
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  )
}