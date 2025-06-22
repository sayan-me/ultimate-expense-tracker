"use client"

import { cn } from "@/lib/utils"
import { Users, User } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"

export function ModePanel() {
  const { isGroupMode, toggleMode } = useActivities()

  return (
    <div className="flex w-full max-w-[280px] items-center justify-between rounded-full border bg-background p-1">
      <button
        onClick={() => toggleMode()}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200",
          !isGroupMode 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to personal mode"
      >
        <User className="h-4 w-4" />
        <span>Personal</span>
      </button>
      
      <button
        onClick={() => toggleMode()}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200",
          isGroupMode 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to group mode"
      >
        <Users className="h-4 w-4" />
        <span>Group</span>
      </button>
    </div>
  )
} 