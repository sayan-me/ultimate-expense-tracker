"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { PERSONAL_ACTIVITIES, GROUP_ACTIVITIES } from "@/components/layout/activities-bar"

// Separate type for serialized actions and state
type SerializedAction = {
  label: string
}

type PersistedState = {
  selectedActions: SerializedAction[]
  isGroupMode: boolean
  isCustomizing: boolean
}

interface ActivitiesContextType {
  actions: typeof PERSONAL_ACTIVITIES
  isActivitiesBarOpen: boolean
  isCustomizing: boolean
  selectedQuickActions: typeof PERSONAL_ACTIVITIES
  isGroupMode: boolean
  toggleActivitiesBar: (open?: boolean) => void
  toggleCustomizationMode: (enabled?: boolean) => void
  toggleQuickAction: (action: typeof PERSONAL_ACTIVITIES[0]) => void
  closeActivitiesBar: () => void
  toggleMode: () => void
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [isActivitiesBarOpen, setIsActivitiesBarOpen] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [selectedQuickActions, setSelectedQuickActions] = useState<typeof PERSONAL_ACTIVITIES>([])
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize state from localStorage
  useEffect(() => {
    if (!isInitialized && typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('appState')
        if (savedState) {
          const { selectedActions, isGroupMode: savedGroupMode, isCustomizing: savedCustomizing } = 
            JSON.parse(savedState) as PersistedState
          
          const hydratedActions = selectedActions
            .map(({ label }) => PERSONAL_ACTIVITIES.find(a => a.label === label))
            .filter(Boolean) as typeof PERSONAL_ACTIVITIES

          setSelectedQuickActions(hydratedActions.length ? hydratedActions : PERSONAL_ACTIVITIES.slice(0, 6))
          setIsGroupMode(savedGroupMode)
          setIsCustomizing(savedCustomizing)
        } else {
          setSelectedQuickActions(PERSONAL_ACTIVITIES.slice(0, 6))
        }
      } catch (error) {
        console.error('Failed to load app state:', error)
        setSelectedQuickActions(PERSONAL_ACTIVITIES.slice(0, 6))
      } finally {
        setIsInitialized(true)
      }
    }
  }, [isInitialized])

  // Persist state changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const stateToSave: PersistedState = {
        selectedActions: selectedQuickActions.map(({ label }) => ({ label })),
        isGroupMode,
        isCustomizing
      }
      localStorage.setItem('appState', JSON.stringify(stateToSave))
    }
  }, [selectedQuickActions, isGroupMode, isCustomizing, isInitialized])

  const toggleQuickAction = useCallback((action: typeof PERSONAL_ACTIVITIES[0]) => {
    setSelectedQuickActions(prev => {
      const isSelected = prev.some(a => a.label === action.label)
      const newActions = isSelected
        ? prev.filter(a => a.label !== action.label)
        : [...prev, action]
      
      const finalActions = newActions.slice(0, 9)
      
      // Store only necessary data
      if (typeof window !== 'undefined') {
        const serialized = finalActions.map(({ label }) => ({ label }))
        localStorage.setItem('quickActions', JSON.stringify(serialized))
      }
      return finalActions
    })
  }, [])

  const toggleActivitiesBar = useCallback((open?: boolean) => {
    setIsActivitiesBarOpen((prev: boolean) => open ?? !prev)
  }, [])

  const toggleCustomizationMode = useCallback((enabled?: boolean) => {
    setIsCustomizing(prev => {
      const newValue = enabled ?? !prev
      if (!newValue) {
        setIsActivitiesBarOpen(false)
      }
      return newValue
    })
  }, [])

  const closeActivitiesBar = useCallback(() => {
    setIsActivitiesBarOpen(false)
    setIsCustomizing(false)
  }, [])

  const toggleMode = useCallback(() => {
    setIsGroupMode(prev => !prev)
  }, [])

  return (
    <ActivitiesContext.Provider 
      value={{ 
        actions: isGroupMode ? GROUP_ACTIVITIES : PERSONAL_ACTIVITIES,
        isActivitiesBarOpen,
        isCustomizing,
        selectedQuickActions,
        isGroupMode,
        toggleActivitiesBar,
        toggleCustomizationMode,
        toggleQuickAction,
        closeActivitiesBar,
        toggleMode
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  )
}

export const useActivities = () => {
  const context = useContext(ActivitiesContext)
  if (!context) throw new Error("useActivities must be used within ActivitiesProvider")
  return context
} 