"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { PERSONAL_ACTIVITIES, GROUP_ACTIVITIES } from "@/constants/activities"

// Separate type for serialized actions and state
type SerializedAction = {
  label: string
}

type PersistedState = {
  personalActions: SerializedAction[]
  groupActions: SerializedAction[]
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
  const [personalQuickActions, setPersonalQuickActions] = useState(PERSONAL_ACTIVITIES.slice(0, 6))
  const [groupQuickActions, setGroupQuickActions] = useState(GROUP_ACTIVITIES.slice(0, 6))
  const [isGroupMode, setIsGroupMode] = useState(false)
  
  const selectedQuickActions = isGroupMode ? groupQuickActions : personalQuickActions
  const setSelectedQuickActions = isGroupMode ? setGroupQuickActions : setPersonalQuickActions

  // Single initialization useEffect
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedState = localStorage.getItem('appState')
      if (savedState) {
        const { personalActions, groupActions, isGroupMode: savedGroupMode } = JSON.parse(savedState) as PersistedState
        
        // Reconstruct full action objects from saved labels
        const hydratedPersonalActions = personalActions
          .map(({ label }) => PERSONAL_ACTIVITIES.find(a => a.label === label))
          .filter(Boolean) as typeof PERSONAL_ACTIVITIES
        
        const hydratedGroupActions = groupActions
          .map(({ label }) => GROUP_ACTIVITIES.find(a => a.label === label))
          .filter(Boolean) as typeof GROUP_ACTIVITIES

        // Set states with hydrated or default values
        setPersonalQuickActions(hydratedPersonalActions.length ? hydratedPersonalActions : PERSONAL_ACTIVITIES.slice(0, 6))
        setGroupQuickActions(hydratedGroupActions.length ? hydratedGroupActions : GROUP_ACTIVITIES.slice(0, 6))
        setIsGroupMode(savedGroupMode)
      }
    } catch (error) {
      console.error('Failed to load saved activities:', error)
      // Fallback to defaults if loading fails
      setPersonalQuickActions(PERSONAL_ACTIVITIES.slice(0, 6))
      setGroupQuickActions(GROUP_ACTIVITIES.slice(0, 6))
      setIsGroupMode(false)
    }
  }, []) // Empty dependency array - runs once on mount

  // Persist state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave: PersistedState = {
        personalActions: personalQuickActions.map(({ label }) => ({ label })),
        groupActions: groupQuickActions.map(({ label }) => ({ label })),
        isGroupMode,
        isCustomizing
      }
      localStorage.setItem('appState', JSON.stringify(stateToSave))
    }
  }, [personalQuickActions, groupQuickActions, isGroupMode, isCustomizing])

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
  }, [setSelectedQuickActions])

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