import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  Status, StoreState, ActivitiesBarState, 
  ModalState, UILayoutState, ActivitiesBarHeight,
  CustomizationTarget, ModalId,
  NavigationHistoryEntry, NavigationState
} from '@/types/store'
import { useState, TouchEvent } from 'react'

/** Enhanced UI state and methods */
interface UIState extends StoreState {
  /** Activities Bar States */
  activitiesBar: ActivitiesBarState
  /** Modal States */
  modal: ModalState
  /** Loading and Transition States */
  states: {
    loading: Record<string, boolean>
    transition: Record<string, boolean>
    overlay: boolean
  }
  /** Layout States */
  layout: UILayoutState
  
  /** Navigation State */
  navigation: NavigationState
  
  // Methods
  /** Activities Bar Controls */
  setActivitiesBar: (state: Partial<ActivitiesBarState>) => void
  /** Modal Controls */
  setModal: (id: ModalId, props?: Record<string, unknown>) => void
  /** State Controls */
  setLoading: (key: string, isLoading: boolean) => void
  setTransition: (key: string, isTransitioning: boolean) => void
  setOverlay: (isVisible: boolean) => void
  /** Layout Controls */
  updateLayout: (measurements: Partial<UILayoutState>) => void
  /** Reset UI state */
  resetUI: () => void
  
  /** Navigation Controls */
  pushNavigationEntry: (path: string, state?: Record<string, unknown>) => void
  popNavigationEntry: () => NavigationHistoryEntry | undefined
  clearNavigationHistory: () => void
}

const initialState = {
  activitiesBar: {
    isOpen: false,
    isExpanded: false,
    isCustomizing: false,
    customizationTarget: null as CustomizationTarget,
    height: 'minimized' as ActivitiesBarHeight
  },
  modal: {
    activeId: null as ModalId,
    props: {}
  },
  states: {
    loading: {},
    transition: {},
    overlay: false
  },
  layout: {
    headerHeight: 0,
    bottomNavHeight: 0,
    contentPadding: 16
  },
  status: 'idle' as Status,
  error: null,
  navigation: {
    history: [],
    canGoBack: false,
    isTransitioning: false
  }
}

// Selectors for Activities Bar
/** Check if activities bar is in customization mode */
const selectIsCustomizing = (state: UIState) => state.activitiesBar.isCustomizing

/** Get activities bar current height */
const selectActivitiesBarHeight = (state: UIState) => state.activitiesBar.height

/** Check if activities bar is fully expanded */
const selectIsActivitiesBarExpanded = (state: UIState) => 
  state.activitiesBar.isExpanded && state.activitiesBar.height === 'full'

// Selectors for Modal State
/** Get current modal with its props */
const selectActiveModalWithProps = (state: UIState) => ({
  id: state.modal.activeId,
  props: state.modal.props
})

// Selectors for Layout
/** Calculate content area dimensions */
const selectContentDimensions = (state: UIState) => ({
  height: `calc(100vh - ${state.layout.headerHeight}px - ${state.layout.bottomNavHeight}px)`,
  padding: state.layout.contentPadding
})

/** Check if any overlay should be visible */
const selectIsOverlayVisible = (state: UIState) =>
  state.states.overlay || 
  (state.activitiesBar.isOpen && state.activitiesBar.height !== 'minimized')

/** Get loading state for multiple keys */
const selectLoadingStates = (state: UIState, keys: string[]) => 
  keys.some(key => state.states.loading[key])

/** Get transition state for multiple keys */
export const selectTransitionStates = (state: UIState, keys: string[]) => 
  keys.some(key => state.states.transition[key])

/** Check if any modal is open */
const selectHasActiveModal = (state: UIState) => 
  state.modal.activeId !== null

/**
 * UI Store for managing application-wide UI state
 * Handles activities bar, modals, loading states, layout measurements, and navigation
 * 
 * @example
 * ```tsx
 * // Basic usage
 * function Component() {
 *   const { setModal, setLoading } = useUIStore()
 *   
 *   const handleAction = async () => {
 *     setLoading('save', true)
 *     try {
 *       await saveData()
 *       setModal('success')
 *     } finally {
 *       setLoading('save', false)
 *     }
 *   }
 * }
 * 
 * // With multiple state updates
 * function NavigationComponent() {
 *   const { pushNavigationEntry, setTransition } = useUIStore()
 *   
 *   const navigate = async (path: string) => {
 *     setTransition('navigation', true)
 *     try {
 *       await pushNavigationEntry(path)
 *     } finally {
 *       setTransition('navigation', false)
 *     }
 *   }
 * }
 * ```
 */
export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Update activities bar state
       * @param newState - Partial state to merge with current state
       */
      setActivitiesBar: (newState) => 
        set((state) => ({
          activitiesBar: { ...state.activitiesBar, ...newState }
        })),

      /**
       * Set active modal and its props
       * @param id - Modal identifier
       * @param props - Modal properties
       */
      setModal: (id, props = {}) => 
        set({ modal: { activeId: id, props } }),

      /**
       * Set loading state for specific key
       * @param key - Unique identifier for loading state
       * @param isLoading - Loading state value
       */
      setLoading: (key, isLoading) => 
        set((state) => ({
          states: { 
            ...state.states, 
            loading: { ...state.states.loading, [key]: isLoading }
          }
        })),

      /**
       * Set transition state for specific key
       * @param key - Unique identifier for transition state
       * @param isTransitioning - Transition state value
       */
      setTransition: (key, isTransitioning) =>
        set((state) => ({
          states: { 
            ...state.states, 
            transition: { ...state.states.transition, [key]: isTransitioning }
          }
        })),

      /**
       * Set overlay visibility
       * @param isVisible - Overlay visibility state
       */
      setOverlay: (isVisible) => 
        set((state) => ({
          states: { ...state.states, overlay: isVisible }
        })),

      /**
       * Update layout measurements
       * @param measurements - Partial layout measurements to update
       */
      updateLayout: (measurements) => 
        set((state) => ({
          layout: { ...state.layout, ...measurements }
        })),

      /**
       * Reset UI state to initial values
       */
      resetUI: () => set(initialState),

      /**
       * Add new entry to navigation history
       * @param path - Navigation path
       * @param state - Optional navigation state
       */
      pushNavigationEntry: (path, state) => 
        set((currentState) => ({
          navigation: {
            ...currentState.navigation,
            history: [...currentState.navigation.history, { 
              path, 
              state: state as Record<string, unknown>, 
              timestamp: Date.now() 
            }],
            canGoBack: true
          }
        })),

      /**
       * Remove last entry from navigation history
       * @returns Removed navigation entry or undefined if history is empty
       */
      popNavigationEntry: () => {
        const state = get()
        const lastEntry = state.navigation.history[state.navigation.history.length - 1]
        set((state) => ({
          navigation: {
            ...state.navigation,
            history: state.navigation.history.slice(0, -1),
            canGoBack: state.navigation.history.length > 1
          }
        }))
        return lastEntry
      },

      /**
       * Clear navigation history
       */
      clearNavigationHistory: () => 
        set((state) => ({
          navigation: {
            ...state.navigation,
            history: [],
            canGoBack: false
          }
        }))
    }),
    {
      name: 'ui',
      /**
       * Filter function to reduce noise in Redux DevTools
       * Excludes frequent updates from loading and transition states
       * 
       * @param action - Redux DevTools action object
       * @returns boolean indicating if action should be logged
       * 
       * @example
       * ```ts
       * // These actions will be filtered out
       * { type: 'setLoading/start' } // -> false
       * { type: 'setTransition/complete' } // -> false
       * 
       * // These actions will be logged
       * { type: 'setModal' } // -> true
       * { type: 'pushNavigationEntry' } // -> true
       * ```
       */
      actionFilter: (action: { type: string }) => 
        !action.type.includes('setLoading') && 
        !action.type.includes('setTransition'),

      /**
       * Groups related actions in Redux DevTools
       * Helps organize actions by feature area
       * 
       * @param action - Redux DevTools action object
       * @returns string indicating the action group
       * 
       * @example
       * ```ts
       * // Actions will be grouped as follows:
       * { type: 'setActivitiesBar' } // -> 'Activities Bar'
       * { type: 'setModal' } // -> 'Modals'
       * { type: 'pushNavigationEntry' } // -> 'Navigation'
       * { type: 'setOverlay' } // -> 'Other'
       * ```
       */
      actionGrouper: (action: { type: string }) => {
        if (action.type.includes('activitiesBar')) return 'Activities Bar'
        if (action.type.includes('modal')) return 'Modals'
        if (action.type.includes('navigation')) return 'Navigation'
        return 'Other'
      },

      // Enable detailed logging in development
      loggerOptions: {
        collapsed: true,
        timestamp: true
      }
    }
  )
)

/**
 * Hook for managing activities bar interactions
 * @example
 * ```tsx
 * function ActivitiesBar() {
 *   const { 
 *     isCustomizing,
 *     height,
 *     openCustomization,
 *     closeCustomization 
 *   } = useActivitiesBarControls()
 *   
 *   return (
 *     <div className={`activities-bar ${height}`}>
 *       {isCustomizing ? (
 *         <CustomizationView onClose={closeCustomization} />
 *       ) : (
 *         <button onClick={() => openCustomization('personal')}>
 *           Customize
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export const useActivitiesBarControls = () => {
  const store = useUIStore()
  
  return {
    isCustomizing: selectIsCustomizing(store),
    height: selectActivitiesBarHeight(store),
    isExpanded: selectIsActivitiesBarExpanded(store),
    openCustomization: (target: CustomizationTarget) => 
      store.setActivitiesBar({
        isCustomizing: true,
        customizationTarget: target,
        height: 'half'
      }),
    closeCustomization: () =>
      store.setActivitiesBar({
        isCustomizing: false,
        customizationTarget: null,
        height: 'minimized'
      })
  }
}

/**
 * Hook for managing modal interactions
 * @example
 * ```tsx
 * function TransactionModal() {
 *   const { activeModal, openModal, closeModal } = useModalControls()
 *   
 *   if (activeModal.id !== 'transaction-details') return null
 *   
 *   return (
 *     <Modal 
 *       onClose={closeModal}
 *       {...activeModal.props}
 *     />
 *   )
 * }
 * ```
 */
export const useModalControls = () => {
  const store = useUIStore()
  
  return {
    activeModal: selectActiveModalWithProps(store),
    openModal: store.setModal,
    closeModal: () => store.setModal(null)
  }
}

/**
 * Hook for managing layout measurements
 * @example
 * ```tsx
 * function Layout() {
 *   const { dimensions, updateHeaderHeight } = useLayoutControls()
 *   const headerRef = useRef<HTMLDivElement>(null)
 *   
 *   useEffect(() => {
 *     if (headerRef.current) {
 *       updateHeaderHeight(headerRef.current.offsetHeight)
 *     }
 *   }, [])
 *   
 *   return (
 *     <div style={dimensions}>
 *       <header ref={headerRef}>...</header>
 *       <main>...</main>
 *     </div>
 *   )
 * }
 * ```
 */
export const useLayoutControls = () => {
  const store = useUIStore()
  
  return {
    dimensions: selectContentDimensions(store),
    updateHeaderHeight: (height: number) => 
      store.updateLayout({ headerHeight: height }),
    updateBottomNavHeight: (height: number) => 
      store.updateLayout({ bottomNavHeight: height })
  }
}

/**
 * Hook for managing overlay visibility
 * @example
 * ```tsx
 * function PageOverlay() {
 *   const { isVisible, show, hide } = useOverlay()
 *   return isVisible ? <div className="overlay" onClick={hide} /> : null
 * }
 * ```
 */
export const useOverlay = () => {
  const store = useUIStore()
  const isVisible = selectIsOverlayVisible(store)
  
  return {
    isVisible,
    show: () => store.setOverlay(true),
    hide: () => store.setOverlay(false),
    toggle: () => store.setOverlay(!store.states.overlay)
  }
}

/**
 * Hook for managing multiple loading states
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { isLoading, startLoading, stopLoading } = useLoadingStates(['save', 'validate'])
 *   return <button disabled={isLoading}>Save</button>
 * }
 * ```
 */
export const useLoadingStates = (keys: string[]) => {
  const store = useUIStore()
  const isLoading = selectLoadingStates(store, keys)
  
  return {
    isLoading,
    startLoading: (key: string) => store.setLoading(key, true),
    stopLoading: (key: string) => store.setLoading(key, false),
    resetLoading: () => keys.forEach(key => store.setLoading(key, false))
  }
}

/**
 * Hook for managing UI transitions
 * @example
 * ```tsx
 * function AnimatedContent() {
 *   const { isTransitioning, startTransition, endTransition } = useTransition('content')
 *   return (
 *     <div className={isTransitioning ? 'fade-out' : 'fade-in'}>
 *       Content
 *     </div>
 *   )
 * }
 * ```
 */
export const useTransition = (key: string) => {
  const store = useUIStore()
  
  return {
    isTransitioning: store.states.transition[key] ?? false,
    startTransition: () => store.setTransition(key, true),
    endTransition: () => store.setTransition(key, false),
    withTransition: async (callback: () => Promise<void>) => {
      store.setTransition(key, true)
      try {
        await callback()
      } finally {
        store.setTransition(key, false)
      }
    }
  }
}

/**
 * Hook for managing swipe navigation
 */
export const useSwipeNavigation = () => {
  const store = useUIStore()
  const [startX, setStartX] = useState<number | null>(null)
  
  const handleSwipeBack = {
    start: (e: TouchEvent<HTMLDivElement>) => setStartX(e.touches[0].clientX),
    move: (e: TouchEvent<HTMLDivElement>) => {
      if (!startX) return
      const diff = e.touches[0].clientX - startX
      if (diff > 100 && store.navigation.canGoBack) {
        store.setTransition('navigation', true)
      }
    },
    end: (e: TouchEvent<HTMLDivElement>) => {
      if (!startX) return
      const diff = e.changedTouches[0].clientX - startX
      if (diff > 100 && store.navigation.canGoBack) {
        store.popNavigationEntry()
      }
      setStartX(null)
      store.setTransition('navigation', false)
    }
  }

  return {
    handleSwipeBack,
    isTransitioning: store.states.transition['navigation'] ?? false
  }
}

// Utility Functions
/**
 * Creates a debounced layout update function
 * @example
 * ```tsx
 * const debouncedUpdate = createDebouncedLayoutUpdate(store.updateLayout, 100)
 * window.addEventListener('resize', () => {
 *   debouncedUpdate({ contentPadding: window.innerWidth > 768 ? 24 : 16 })
 * })
 * ```
 */
export const createDebouncedLayoutUpdate = (
  updateFn: (measurements: Partial<UILayoutState>) => void,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout
  return (measurements: Partial<UILayoutState>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => updateFn(measurements), delay)
  }
}

/**
 * Utility to manage multiple loading states with cleanup
 * @example
 * ```tsx
 * const loadingManager = createLoadingManager(store.setLoading)
 * loadingManager.start(['save', 'validate'])
 * // ... do something
 * loadingManager.stop(['save', 'validate'])
 * ```
 */
export const createLoadingManager = (
  setLoading: (key: string, isLoading: boolean) => void
) => ({
  start: (keys: string[]) => keys.forEach(key => setLoading(key, true)),
  stop: (keys: string[]) => keys.forEach(key => setLoading(key, false))
})

/**
 * Hook to check if any modal is currently open
 * @example
 * ```tsx
 * function App() {
 *   const hasActiveModal = useHasActiveModal()
 *   return hasActiveModal ? <ModalOverlay /> : null
 * }
 * ```
 */
export const useHasActiveModal = () => {
  return useUIStore((state) => selectHasActiveModal(state))
}