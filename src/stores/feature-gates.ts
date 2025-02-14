import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { Feature, Status, StoreState } from '@/types/store'
import { useAuthStore } from './auth'
import { APP_FEATURES } from '@/config/features'

/** Feature gates store state and methods */
interface FeatureGatesState extends StoreState {
  /** Available features and their current state */
  features: Record<string, Feature>
  /** Update feature availability */
  updateFeature: (featureId: string, isEnabled: boolean) => Promise<void>
  /** Check if a feature is accessible based on user level and enabled status */
  checkFeatureAccess: (featureId: string) => boolean
  /** Reset feature gates to initial state */
  resetFeatureGates: () => void
}

const initialState = {
  features: APP_FEATURES,
  status: 'idle' as Status,
  error: null
}

// Selectors
/** Get a specific feature by ID */
const selectFeature = (state: FeatureGatesState, featureId: string) => 
  state.features[featureId]

/** Check if a specific feature is enabled */
const selectIsFeatureEnabled = (state: FeatureGatesState, featureId: string) => 
  state.features[featureId]?.isEnabled ?? false

/** Get the required user level for a specific feature */
export const selectFeatureRequiredLevel = (state: FeatureGatesState, featureId: string) => 
  state.features[featureId]?.requiredLevel

/**
 * Feature gates store with persistent storage
 * Manages feature access based on user levels and feature flags
 * Example:
 * ```ts
 * const featureGates = useFeatureGatesStore.getState()
 * if (featureGates.checkFeatureAccess('receipt-scanning')) {
 *   // Allow receipt scanning
 * }
 * ```
 */
export const useFeatureGatesStore = create<FeatureGatesState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,
        updateFeature: async (featureId, isEnabled) => {
          set({ status: 'loading' })
          try {
            set((state) => ({
              features: {
                ...state.features,
                [featureId]: {
                  ...state.features[featureId],
                  isEnabled
                }
              },
              status: 'success',
              error: null
            }))
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            set({ 
              status: 'error', 
              error: `Failed to update feature: ${errorMessage}` 
            })
          }
        },
        checkFeatureAccess: (featureId) => {
          const feature = selectFeature(get(), featureId)
          if (!feature || !feature.isEnabled) return false
          
          const userLevel = useAuthStore.getState().userLevel
          const userLevelWeight = {
            basic: 0,
            registered: 1,
            premium: 2
          }
          
          return userLevelWeight[userLevel] >= userLevelWeight[feature.requiredLevel]
        },
        resetFeatureGates: () => set(initialState)
      }),
      { 
        name: 'feature-gates',
        maxAge: 30
      }
    ),
    {
      name: 'feature-gates-storage',
      version: 1
    }
  )
)

/**
 * Hook to check if a feature is accessible to the current user
 * Considers both feature enabled status and user access level
 * @param featureId - Unique identifier of the feature to check
 * @returns boolean indicating if the feature is accessible
 * @example
 * ```tsx
 * function ReceiptScannerButton() {
 *   const hasAccess = useFeatureAccess('receipt-scanning')
 *   if (!hasAccess) return null
 *   return <button>Scan Receipt</button>
 * }
 * ```
 */
export const useFeatureAccess = (featureId: string) => {
  return useFeatureGatesStore((state) => state.checkFeatureAccess(featureId))
}

/**
 * Hook to get full feature configuration
 * Useful when you need access to all feature properties
 * @param featureId - Unique identifier of the feature to retrieve
 * @returns Feature configuration object or undefined if not found
 * @example
 * ```tsx
 * function FeatureInfo({ featureId }: { featureId: string }) {
 *   const feature = useFeature(featureId)
 *   if (!feature) return null
 *   return <div>Required Level: {feature.requiredLevel}</div>
 * }
 * ```
 */
export const useFeature = (featureId: string) => {
  return useFeatureGatesStore((state) => selectFeature(state, featureId))
}

/**
 * Hook to check if a feature is enabled
 * Only checks the enabled flag, not user access level
 * @param featureId - Unique identifier of the feature to check
 * @returns boolean indicating if the feature is enabled
 * @example
 * ```tsx
 * function ExperimentalFeature() {
 *   const isEnabled = useIsFeatureEnabled('experimental')
 *   if (!isEnabled) return null
 *   return <div>New Feature!</div>
 * }
 * ```
 */
export const useIsFeatureEnabled = (featureId: string) => {
  return useFeatureGatesStore((state) => selectIsFeatureEnabled(state, featureId))
} 