"use client"

import { cn } from "@/lib/utils"
import { Users, User } from "lucide-react"
import { useState } from "react"

type Mode = 'personal' | 'group'

export function ModePanel() {
  const [activeMode, setActiveMode] = useState<Mode>('personal')

  const handleModeChange = (mode: Mode) => {
    setActiveMode(mode)
  }

  return (
    <div className="flex w-full max-w-[280px] items-center justify-between rounded-full border bg-background p-1">
      <button
        onClick={() => handleModeChange('personal')}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200",
          activeMode === 'personal' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to personal mode"
      >
        <User className="h-4 w-4" />
        <span>Personal</span>
      </button>
      
      <button
        onClick={() => handleModeChange('group')}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200",
          activeMode === 'group' 
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