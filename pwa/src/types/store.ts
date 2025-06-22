/** Represents the current status of an operation */
export type Status = 'idle' | 'loading' | 'error' | 'success'

/** Available theme options for the application */
export type Theme = 'light' | 'dark' | 'system'

/** User access levels in the application */
export type UserLevel = 'basic' | 'registered' | 'premium'

/** Base interface for all store states */
export interface StoreState {
  /** Current status of the store operations */
  status: Status
  /** Error message if any operation fails */
  error: string | null
}

/** Feature configuration for feature gating */
export interface Feature {
  /** Unique identifier for the feature */
  id: string
  /** Display name of the feature */
  name: string
  /** Minimum user level required to access the feature */
  requiredLevel: UserLevel
  /** Whether the feature is currently enabled */
  isEnabled: boolean
}

/** Quick action configuration for shortcuts and activities */
export interface QuickAction {
  /** Unique identifier for the action */
  id: string
  /** Icon to display for the action */
  icon: string
  /** Display label for the action */
  label: string
  /** Action identifier to execute */
  action: string
  /** Position in the quick actions list */
  position: number
}

/** UI-specific types */
export type ActivitiesBarHeight = 'full' | 'half' | 'minimized'
export type CustomizationTarget = 'personal' | 'group' | null
export type ModalId = 'transaction-details' | 'settings' | 'quick-actions' | string | null

/** UI Store specific interfaces */
export interface ActivitiesBarState {
  isOpen: boolean
  isExpanded: boolean
  isCustomizing: boolean
  customizationTarget: CustomizationTarget
  height: ActivitiesBarHeight
}

export interface ModalState {
  activeId: ModalId
  props: Record<string, unknown>
}

export interface UILayoutState {
  headerHeight: number
  bottomNavHeight: number
  contentPadding: number
}

/** Navigation history entry */
export interface NavigationHistoryEntry {
  path: string
  state?: Record<string, unknown>
  timestamp: number
}

/** Navigation state interface */
export interface NavigationState {
  history: NavigationHistoryEntry[]
  canGoBack: boolean
  isTransitioning: boolean
} 