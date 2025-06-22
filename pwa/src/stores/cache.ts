import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { Status, StoreState } from '@/types/store'
import { useOfflineSyncStore } from './offline-sync'
import React from 'react'

/** Cache entry with metadata */
interface CacheEntry<T> {
  /** Cached data */
  data: T
  /** When the data was cached */
  timestamp: number
  /** When the cache expires */
  expiresAt: number
  /** Size of cached data in bytes (approximate) */
  size: number
  /** Cache type for grouping and cleanup */
  type: 'data' | 'asset' | 'api'
  /** Cache priority (higher = keep longer) */
  priority: number
}

/** Cache event types */
type CacheEvent = 
  | { type: 'itemAdded'; key: string; size: number }
  | { type: 'itemRemoved'; key: string }
  | { type: 'cacheCleared' }
  | { type: 'cleanupPerformed'; itemsRemoved: number }

/** Cache event listener */
type CacheEventListener = (event: CacheEvent) => void

/** Cache persistence configuration */
interface CachePersistConfig {
  /** Whether to persist cache data */
  enabled: boolean
  /** Storage key prefix */
  prefix?: string
  /** Maximum age of persisted data in ms */
  maxAge?: number
  /** Types of data to persist */
  persistTypes?: CacheEntry<unknown>['type'][]
}

/** Network-aware cleanup configuration */
interface NetworkCleanupConfig {
  /** Cleanup aggressive level when offline */
  offlineCleanupThreshold: number
  /** Types to preserve offline */
  offlinePriorityTypes: CacheEntry<unknown>['type'][]
  /** Minimum priority to keep when offline */
  offlineMinPriority: number
}

/** Cache store state and methods */
interface CacheState extends StoreState {
  /** Cached items by key */
  items: Record<string, CacheEntry<unknown>>
  /** Total cache size in bytes */
  totalSize: number
  /** Maximum cache size in bytes (default: 50MB) */
  maxSize: number
  /** Event listeners */
  listeners: Set<CacheEventListener>
  
  /** Persistence configuration */
  persistConfig: CachePersistConfig
  /** Network cleanup configuration */
  networkCleanup: NetworkCleanupConfig
  
  /** Update persistence configuration */
  updatePersistConfig: (config: Partial<CachePersistConfig>) => void
  /** Update network cleanup configuration */
  updateNetworkCleanup: (config: Partial<NetworkCleanupConfig>) => void
  
  // Cache Methods
  /** 
   * Add or update cache entry
   * @example
   * ```ts
   * const cache = useCacheStore.getState()
   * 
   * // Cache API response
   * cache.setItem('user-profile', userData, {
   *   type: 'api',
   *   expiresIn: 30 * 60 * 1000, // 30 minutes
   *   priority: 2
   * })
   * ```
   */
  setItem: <T>(
    key: string,
    data: T,
    options?: {
      expiresIn?: number
      type?: CacheEntry<T>['type']
      priority?: number
    }
  ) => void
  
  /** Get cached item */
  getItem: <T>(key: string) => T | null
  
  /** Remove cached item */
  removeItem: (key: string) => void
  
  /** Clear all cached items */
  clearCache: () => void
  
  /** Clear expired items */
  clearExpired: () => void
  
  /** Cleanup cache when size exceeds limit */
  runCleanup: () => void

  /** Add event listener */
  addEventListener: (listener: CacheEventListener) => () => void
  /** Remove event listener */
  removeEventListener: (listener: CacheEventListener) => void
  /** Notify listeners of cache events */
  notify: (event: CacheEvent) => void
}

type CacheStateProperties = Omit<CacheState, 
  | 'updatePersistConfig' 
  | 'updateNetworkCleanup' 
  | 'setItem' 
  | 'getItem' 
  | 'removeItem' 
  | 'clearCache' 
  | 'clearExpired' 
  | 'runCleanup'
  | 'addEventListener'
  | 'removeEventListener'
  | 'notify'
>

const initialState: CacheStateProperties = {
  items: {},
  totalSize: 0,
  maxSize: 50 * 1024 * 1024,
  status: 'idle' as Status,
  error: null,
  listeners: new Set<CacheEventListener>(),
  persistConfig: {
    enabled: true,
    prefix: 'app-cache',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    persistTypes: ['data', 'asset'] as CacheEntry<unknown>['type'][]
  },
  networkCleanup: {
    offlineCleanupThreshold: 0.7,
    offlinePriorityTypes: ['data'] as ('data' | 'asset' | 'api')[],
    offlineMinPriority: 2
  }
}

/**
 * Cache store with persistent storage
 * Manages cached data with size limits, expiration, and priority-based cleanup
 * Integrates with offline sync store for network-aware caching
 * @example
 * ```ts
 * const cache = useCacheStore.getState()
 * const syncStore = useOfflineSyncStore.getState()
 * 
 * // Cache API response with network awareness
 * async function fetchAndCacheUser(userId: string) {
 *   const cached = cache.getItem<UserData>(`user-${userId}`)
 *   if (cached) return cached
 *   
 *   if (!syncStore.network.isOnline) {
 *     throw new Error('Offline: Cannot fetch user data')
 *   }
 *   
 *   const userData = await fetchUser(userId)
 *   cache.setItem(`user-${userId}`, userData, {
 *     type: 'api',
 *     expiresIn: 30 * 60 * 1000
 *   })
 *   return userData
 * }
 * ```
 */
export const useCacheStore = create<CacheState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        addEventListener: (listener) => {
          set(state => ({
            listeners: new Set([...state.listeners, listener])
          }))
          return () => get().removeEventListener(listener)
        },

        removeEventListener: (listener) => {
          set(state => ({
            listeners: new Set(
              [...state.listeners].filter(l => l !== listener)
            )
          }))
        },

        notify: (event) => {
          get().listeners.forEach(listener => listener(event))
        },

        setItem: (key, data, options = {}) => {
          const syncStore = useOfflineSyncStore.getState()
          if (!syncStore.network.isOnline && options.type === 'api') {
            set({ status: 'error', error: 'Cannot cache API data while offline' })
            return
          }

          const {
            expiresIn = 24 * 60 * 60 * 1000, // 24 hours
            type = 'data',
            priority = 1
          } = options

          const size = new Blob([JSON.stringify(data)]).size
          const timestamp = Date.now()
          const expiresAt = timestamp + expiresIn

          set((state) => {
            const newTotalSize = state.totalSize - (state.items[key]?.size || 0) + size
            
            if (newTotalSize > state.maxSize) {
              get().runCleanup()
            }

            get().notify({ type: 'itemAdded', key, size })

            return {
              items: {
                ...state.items,
                [key]: { data, timestamp, expiresAt, size, type, priority }
              },
              totalSize: newTotalSize,
              status: 'success',
              error: null
            }
          })
        },

        getItem: <T>(key: string) => {
          const item = get().items[key]
          if (!item || Date.now() > item.expiresAt) {
            get().removeItem(key)
            return null
          }
          return item.data as T
        },

        removeItem: (key) => {
          set((state) => {
            const size = state.items[key]?.size || 0
            get().notify({ type: 'itemRemoved', key })
            return {
              items: Object.fromEntries(
                Object.entries(state.items).filter(([k]) => k !== key)
              ),
              totalSize: state.totalSize - size
            }
          })
        },

        clearCache: () => {
          set({ ...initialState })
          get().notify({ type: 'cacheCleared' })
        },

        clearExpired: () => {
          const now = Date.now()
          set((state) => {
            const validItems = Object.entries(state.items)
              .filter(([, item]) => item.expiresAt > now)
            
            return {
              items: Object.fromEntries(validItems),
              totalSize: validItems.reduce((sum, [, item]) => sum + item.size, 0)
            }
          })
          get().notify({ type: 'cleanupPerformed', itemsRemoved: 0 })
        },

        runCleanup: () => {
          const syncStore = useOfflineSyncStore.getState()
          const { networkCleanup } = get()
          
          set((state) => {
            const now = Date.now()
            let items = Object.entries(state.items)
              .filter(([, item]) => item.expiresAt > now)

            // Apply network-aware filtering
            if (!syncStore.network.isOnline) {
              items = items.filter(([, item]) => 
                networkCleanup.offlinePriorityTypes.includes(item.type) ||
                item.priority >= networkCleanup.offlineMinPriority
              )
            }

            // Sort by priority and network status
            items.sort(([, a], [, b]) => {
              if (a.priority !== b.priority) return a.priority - b.priority
              if (a.type !== b.type) {
                return networkCleanup.offlinePriorityTypes.includes(a.type) ? 1 : -1
              }
              return 0
            })

            if (items.reduce((sum, [, item]) => sum + item.size, 0) > state.maxSize) {
              items.sort(([, a], [, b]) => a.priority - b.priority)
              
              let totalSize = 0
              items = items.filter(([, item]) => {
                if (totalSize + item.size <= state.maxSize) {
                  totalSize += item.size
                  return true
                }
                return false
              })
            }

            get().notify({ type: 'cleanupPerformed', itemsRemoved: items.length })

            return {
              items: Object.fromEntries(items),
              totalSize: items.reduce((sum, [, item]) => sum + item.size, 0)
            }
          })
        },

        updatePersistConfig: (config) => 
          set(state => ({ 
            persistConfig: { ...state.persistConfig, ...config } 
          })),

        updateNetworkCleanup: (config) => 
          set(state => ({ 
            networkCleanup: { ...state.networkCleanup, ...config } 
          }))
      }),
      { name: 'cache' }
    ),
    {
      name: 'cache-storage',
      version: 1,
      partialize: (state) => 
        state.persistConfig.enabled ? {
          items: Object.fromEntries(
            Object.entries(state.items).filter(([, item]) =>
              state.persistConfig.persistTypes?.includes(item.type) &&
              Date.now() - item.timestamp <= (state.persistConfig.maxAge || Infinity)
            )
          ),
          persistConfig: state.persistConfig,
          networkCleanup: state.networkCleanup
        } : {}
    }
  )
)

// Selectors
/**
 * Get cache statistics
 * @example
 * ```tsx
 * function CacheStats() {
 *   const { current, max, percentage } = useCacheStore(selectCacheSize)
 *   return (
 *     <div>
 *       Cache usage: {(current / 1024 / 1024).toFixed(1)}MB 
 *       of {(max / 1024 / 1024).toFixed(1)}MB 
 *       ({percentage.toFixed(1)}%)
 *     </div>
 *   )
 * }
 * ```
 */
export const selectCacheSize = (state: CacheState) => ({
  current: state.totalSize,
  max: state.maxSize,
  percentage: (state.totalSize / state.maxSize) * 100
})

/**
 * Get a cached item by key with type safety
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const userData = useCacheStore(
 *     state => selectCacheItem<UserData>(state, `user-${userId}`)
 *   )
 *   if (!userData) return <UserProfileSkeleton />
 *   return <UserProfileContent user={userData} />
 * }
 * ```
 */
export const selectCacheItem = <T>(state: CacheState, key: string) => 
  state.items[key]?.data as T | undefined 

// Add hooks
/**
 * Hook to monitor cache events
 * @example
 * ```tsx
 * function CacheMonitor() {
 *   useCacheEvents({
 *     onItemAdded: (key, size) => console.log(`Added ${key}: ${size} bytes`),
 *     onCacheCleared: () => console.log('Cache cleared')
 *   })
 *   return null
 * }
 * ```
 */
export const useCacheEvents = (handlers: {
  onItemAdded?: (key: string, size: number) => void
  onItemRemoved?: (key: string) => void
  onCacheCleared?: () => void
  onCleanupPerformed?: (itemsRemoved: number) => void
}) => {
  React.useEffect(() => {
    const listener = (event: CacheEvent) => {
      switch (event.type) {
        case 'itemAdded':
          handlers.onItemAdded?.(event.key, event.size)
          break
        case 'itemRemoved':
          handlers.onItemRemoved?.(event.key)
          break
        case 'cacheCleared':
          handlers.onCacheCleared?.()
          break
        case 'cleanupPerformed':
          handlers.onCleanupPerformed?.(event.itemsRemoved)
          break
      }
    }

    return useCacheStore.getState().addEventListener(listener)
  }, [handlers])
}

/**
 * Hook to monitor cache size changes
 * @example
 * ```tsx
 * function CacheSizeWarning() {
 *   const { percentage } = useCacheSize()
 *   if (percentage > 90) {
 *     return <Alert>Cache almost full!</Alert>
 *   }
 *   return null
 * }
 * ```
 */
export const useCacheSize = () => {
  return useCacheStore(selectCacheSize)
}

/**
 * Hook to manage cache persistence
 * @example
 * ```tsx
 * function CacheSettings() {
 *   const { config, updateConfig } = useCachePersistence()
 *   return (
 *     <Switch
 *       checked={config.enabled}
 *       onChange={(enabled) => updateConfig({ enabled })}
 *     />
 *   )
 * }
 * ```
 */
export const useCachePersistence = () => {
  const config = useCacheStore(state => state.persistConfig)
  const updateConfig = useCacheStore(state => state.updatePersistConfig)
  return { config, updateConfig }
}

/**
 * Hook to manage network-aware cache cleanup
 * @example
 * ```tsx
 * function CacheCleanupSettings() {
 *   const { config, updateConfig } = useNetworkCleanup()
 *   return (
 *     <Slider
 *       value={config.offlineCleanupThreshold * 100}
 *       onChange={(value) => updateConfig({ 
 *         offlineCleanupThreshold: value / 100 
 *       })}
 *     />
 *   )
 * }
 * ```
 */
export const useNetworkCleanup = () => {
  const config = useCacheStore(state => state.networkCleanup)
  const updateConfig = useCacheStore(state => state.updateNetworkCleanup)
  return { config, updateConfig }
}

/**
 * Hook to monitor cache health
 * @example
 * ```tsx
 * function CacheHealth() {
 *   const health = useCacheHealth()
 *   if (health.status === 'warning') {
 *     return <Alert>Cache needs cleanup</Alert>
 *   }
 *   return null
 * }
 * ```
 */
export const useCacheHealth = () => {
  const size = useCacheStore(selectCacheSize)
  const isOnline = useOfflineSyncStore(state => state.network.isOnline)
  const cleanupConfig = useCacheStore(state => state.networkCleanup)

  const threshold = isOnline 
    ? 0.9 // 90% when online
    : cleanupConfig.offlineCleanupThreshold

  return {
    status: size.percentage > threshold * 100 ? 'warning' : 'healthy',
    isOnline,
    threshold: threshold * 100,
    ...size
  }
} 