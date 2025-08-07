import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { Status, Theme, StoreState, QuickAction } from '@/types/store'

/** Preferences store for managing user preferences and shortcuts */
interface PreferencesState extends StoreState {
  /** Current theme setting */
  theme: Theme
  /** Whether group expense mode is active */
  isGroupMode: boolean
  /** Whether notifications are enabled */
  notificationsEnabled: boolean
  /** Personal shortcuts for quick actions */
  personalShortcuts: QuickAction[]
  /** Group-related shortcuts */
  groupShortcuts: QuickAction[]
  /** Set application theme */
  setTheme: (theme: Theme) => void
  /** Toggle between personal and group modes */
  toggleGroupMode: () => void
  /** Toggle notification settings */
  toggleNotifications: () => void
  /** Update personal shortcuts list */
  updatePersonalShortcuts: (shortcuts: QuickAction[]) => void
  /** Update group shortcuts list */
  updateGroupShortcuts: (shortcuts: QuickAction[]) => void
  /** Reset all preferences to default values */
  resetPreferences: () => void
}

const initialState = {
  theme: 'dark' as Theme,
  isGroupMode: false,
  notificationsEnabled: true,
  personalShortcuts: [],
  groupShortcuts: [],
  status: 'idle' as Status,
  error: null
}

/**
 * Preferences store for managing user preferences and shortcuts
 * Manages theme, group mode, notifications, and shortcuts
 * Example:
 * ```ts
 * const preferences = usePreferencesStore.getState()
 * preferences.setTheme('light')
 * preferences.toggleGroupMode()
 * ```
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    devtools(
      (set) => ({
        ...initialState,
        setTheme: (theme) => set({ theme }),
        toggleGroupMode: () => set((state) => ({ 
          isGroupMode: !state.isGroupMode 
        })),
        toggleNotifications: () => set((state) => ({ 
          notificationsEnabled: !state.notificationsEnabled 
        })),
        updatePersonalShortcuts: (shortcuts) => 
          set({ personalShortcuts: shortcuts }),
        updateGroupShortcuts: (shortcuts) => 
          set({ groupShortcuts: shortcuts }),
        resetPreferences: () => set(initialState)
      }),
      { name: 'preferences' }
    ),
    {
      name: 'preferences-storage',
      version: 1
    }
  )
)

// Selectors
/** Get current theme setting */
const selectTheme = (state: PreferencesState) => state.theme

/** Get group mode status */
const selectIsGroupMode = (state: PreferencesState) => state.isGroupMode

/** Get notifications status */
const selectNotificationsEnabled = (state: PreferencesState) => 
  state.notificationsEnabled

/** Get personal shortcuts */
const selectPersonalShortcuts = (state: PreferencesState) => 
  state.personalShortcuts

/** Get group shortcuts */
const selectGroupShortcuts = (state: PreferencesState) => 
  state.groupShortcuts

/**
 * Hook to get current theme
 * @returns Theme current theme setting
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const theme = useTheme()
 *   return <div>Current theme: {theme}</div>
 * }
 * ```
 */
export const useTheme = () => {
  return usePreferencesStore((state) => selectTheme(state))
}

/**
 * Hook to check if group mode is active
 * @returns boolean indicating if group mode is active
 * @example
 * ```tsx
 * function GroupModeToggle() {
 *   const isGroupMode = useIsGroupMode()
 *   return <div>Group Mode: {isGroupMode ? 'Active' : 'Inactive'}</div>
 * }
 * ```
 */
export const useIsGroupMode = () => {
  return usePreferencesStore((state) => selectIsGroupMode(state))
}

/**
 * Hook to get personal shortcuts
 * @returns QuickAction[] array of personal shortcuts
 * @example
 * ```tsx
 * function PersonalShortcuts() {
 *   const shortcuts = usePersonalShortcuts()
 *   return <div>Personal Shortcuts: {shortcuts.map(shortcut => shortcut.name).join(', ')}</div>
 * }
 * ```
 */
export const usePersonalShortcuts = () => {
  return usePreferencesStore((state) => selectPersonalShortcuts(state))
} 

/**
 * Hook to get group shortcuts
 * @returns QuickAction[] array of group shortcuts
 * @example
 * ```tsx
 * function GroupShortcuts() {
 *   const shortcuts = useGroupShortcuts()
 *   return <div>Group Shortcuts: {shortcuts.map(shortcut => shortcut.name).join(', ')}</div>
 * }
 * ```
 */
export const useGroupShortcuts = () => {
  return usePreferencesStore((state) => selectGroupShortcuts(state))
}

/**
 * Hook to reset preferences to default values
 * @example
 * ```tsx
 * function ResetPreferences() {
 *   const reset = useResetPreferences()
 *   return <button onClick={reset}>Reset Preferences</button>
 * }
 * ```
 */
export const useResetPreferences = () => {
  return usePreferencesStore((state) => state.resetPreferences)
}

/**
 * Hook to check if notifications are enabled
 * @returns boolean indicating if notifications are enabled
 * @example
 * ```tsx
 * function NotificationsStatus() {
 *   const enabled = useNotificationsEnabled()
 *   return <div>Notifications: {enabled ? 'Enabled' : 'Disabled'}</div>
 * }
 * ```
 */
export const useNotificationsEnabled = () => {
  return usePreferencesStore((state) => selectNotificationsEnabled(state))
}