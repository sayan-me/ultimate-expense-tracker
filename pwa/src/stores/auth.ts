import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { Status, StoreState, UserLevel } from '@/types/store'

/** Authentication store state and methods */
interface AuthState extends StoreState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Current user's access level */
  userLevel: UserLevel
  /** Unique identifier for the authenticated user */
  userId: string | null
  /** Set the authentication state */
  setAuthenticated: (authenticated: boolean) => void
  /** Update the user's access level */
  setUserLevel: (level: UserLevel) => void
  /** Set the current user's ID */
  setUserId: (id: string | null) => void
  /** Reset authentication state */
  resetAuth: () => void
}

const initialState = {
  isAuthenticated: false,
  userLevel: 'basic' as UserLevel,
  userId: null,
  status: 'idle' as Status,
  error: null
}

// Selectors
/** Get user's authentication status */
const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated

/** Get current user's access level */
const selectUserLevel = (state: AuthState) => state.userLevel

/** Get current user's ID */
const selectUserId = (state: AuthState) => state.userId

/** Check if user has required access level */
const selectHasAccessLevel = (state: AuthState, requiredLevel: UserLevel) => {
  const userLevelWeight = { basic: 0, registered: 1, premium: 2 }
  return userLevelWeight[state.userLevel] >= userLevelWeight[requiredLevel]
}

/**
 * Authentication store with persistent storage
 * Manages user authentication state and access levels
 * Example:
 * ```ts
 * const auth = useAuthStore.getState()
 * auth.setAuthenticated(true)
 * auth.setUserLevel('premium')
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    devtools(
      (set) => ({
        ...initialState,
        setAuthenticated: (authenticated) => 
          set({ isAuthenticated: authenticated }),
        setUserLevel: (level) => 
          set({ userLevel: level }),
        setUserId: (id) => set({ userId: id }),
        resetAuth: () => set(initialState)
      }),
      { name: 'auth-store' }
    ),
    {
      name: 'auth-storage',
      version: 1
    }
  )
)

/**
 * Hook to check if user is authenticated
 * @returns boolean indicating if user is authenticated
 * @example
 * ```tsx
 * function AuthenticatedContent() {
 *   const isAuthenticated = useIsAuthenticated()
 *   if (!isAuthenticated) return <LoginPrompt />
 *   return <ProtectedContent />
 * }
 * ```
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => selectIsAuthenticated(state))
}

/**
 * Hook to get current user's access level
 * @returns UserLevel current user's access level
 * @example
 * ```tsx
 * function UserBadge() {
 *   const userLevel = useUserLevel()
 *   return <Badge>{userLevel}</Badge>
 * }
 * ```
 */
export const useUserLevel = () => {
  return useAuthStore((state) => selectUserLevel(state))
}

/**
 * Hook to check if user has required access level
 * @param requiredLevel - Minimum required user level
 * @returns boolean indicating if user meets the required level
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const hasAccess = useHasAccessLevel('premium')
 *   if (!hasAccess) return <UpgradePrompt />
 *   return <PremiumContent />
 * }
 * ```
 */
export const useHasAccessLevel = (requiredLevel: UserLevel) => {
  return useAuthStore((state) => selectHasAccessLevel(state, requiredLevel))
} 

/**
 * Hook to get current user's ID
 * @returns string | null current user's ID
 * @example
 * ```tsx
 * function UserInfo() {
 *   const userId = useUserId()
 *   return <div>User ID: {userId}</div>
 * }
 * ```
 */
export const useUserId = () => {
  return useAuthStore((state) => selectUserId(state))
}