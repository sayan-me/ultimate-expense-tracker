import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { Status, StoreState } from '@/types/store'

/** Represents a network operation that needs to be synced */
export interface SyncOperation {
  /** Unique identifier for the operation */
  id: string
  /** Timestamp when operation was created */
  timestamp: number
  /** Type of operation (e.g., 'expense', 'category') */
  entityType: 'expense' | 'category' | 'budget' | 'goal' | 'virtualAccount'
  /** Operation type (create, update, delete) */
  operationType: 'create' | 'update' | 'delete'
  /** Operation data */
  data: unknown
  /** Number of sync attempts */
  attempts: number
  /** Last error message if sync failed */
  lastError?: string
}

/** Network connection state */
export interface NetworkState {
  /** Whether device is online */
  isOnline: boolean
  /** Last time online status was checked */
  lastChecked: number
  /** Network type if available */
  connectionType?: 'wifi' | 'cellular' | 'unknown'
}

/** Offline sync store state and methods */
interface OfflineSyncState extends StoreState {
  /** Current network state */
  network: NetworkState
  /** Queue of operations to be synced */
  operationQueue: SyncOperation[]
  /** Last successful sync timestamp */
  lastSyncTimestamp: number | null
  /** Whether sync is currently in progress */
  isSyncing: boolean
  
  // Network Methods
  /** Update network status */
  setNetworkStatus: (status: Partial<NetworkState>) => void
  
  // Queue Methods
  /** Add operation to sync queue */
  queueOperation: (
    entityType: SyncOperation['entityType'],
    operationType: SyncOperation['operationType'],
    data: unknown
  ) => void
  /** Remove operation from queue */
  dequeueOperation: (operationId: string) => void
  /** Update operation after sync attempt */
  updateOperation: (
    operationId: string, 
    updates: Partial<SyncOperation>
  ) => void
  
  // Sync Methods
  /** Start sync process */
  startSync: () => void
  /** Mark sync as complete */
  completeSyncCycle: () => void
  /** Reset store to initial state */
  resetOfflineSync: () => void
}

const initialState = {
  network: {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: 0,
    connectionType: 'unknown' as const
  },
  operationQueue: [],
  lastSyncTimestamp: null,
  isSyncing: false,
  status: 'idle' as Status,
  error: null
}

/**
 * Offline sync store with persistent storage
 * Manages operation queue and network status for offline-first functionality
 * @example
 * ```ts
 * const syncStore = useOfflineSyncStore.getState()
 * 
 * // Queue a new expense
 * syncStore.queueOperation('expense', 'create', {
 *   amount: 50,
 *   category: 'food'
 * })
 * 
 * // Start sync when online
 * if (syncStore.network.isOnline) {
 *   syncStore.startSync()
 * }
 * ```
 */
export const useOfflineSyncStore = create<OfflineSyncState>()(
  persist(
    devtools(
      (set, get) => {
        // Initialize timestamps on client-side only
        if (typeof window !== 'undefined') {
          set(state => ({
            network: {
              ...state.network,
              lastChecked: Date.now()
            }
          }))
        }
        
        return {
          ...initialState,
          
          setNetworkStatus: (status) => {
            const currentState = get()
            // Only update if there's a meaningful change
            if (
              status.isOnline !== currentState.network.isOnline ||
              status.connectionType !== currentState.network.connectionType
            ) {
              set((state) => ({
                network: {
                  ...state.network,
                  ...status,
                  lastChecked: Date.now()
                }
              }))
            }
          },
          
          queueOperation: (entityType, operationType, data) => {
            const currentState = get()
            // Prevent duplicate operations
            const isDuplicate = currentState.operationQueue.some(
              op => 
                op.entityType === entityType && 
                op.operationType === operationType &&
                JSON.stringify(op.data) === JSON.stringify(data)
            )
            
            if (!isDuplicate) {
              set((state) => ({
                operationQueue: [...state.operationQueue, {
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  entityType,
                  operationType,
                  data,
                  attempts: 0
                }]
              }))
            }
          },
          
          dequeueOperation: (operationId) => set((state) => ({
            operationQueue: state.operationQueue.filter(op => op.id !== operationId)
          })),
          
          updateOperation: (operationId, updates) => set((state) => ({
            operationQueue: state.operationQueue.map(op => 
              op.id === operationId ? { ...op, ...updates } : op
            )
          })),
          
          startSync: () => {
            const currentState = get()
            // Only start sync if we're online and not already syncing
            if (currentState.network.isOnline && !currentState.isSyncing) {
              set({ isSyncing: true })
            }
          },
          
          completeSyncCycle: () => set({
            isSyncing: false,
            lastSyncTimestamp: Date.now()
          }),
          
          resetOfflineSync: () => set(initialState)
        }
      },
      { 
        name: 'offline-sync',
        // Add custom devtools configuration if needed
      }
    ),
    {
      name: 'offline-sync-storage',
      version: 1
    }
  )
)

// Selectors
const selectNetworkStatus = (state: OfflineSyncState) => state.network
const selectOperationQueue = (state: OfflineSyncState) => state.operationQueue
const selectIsSyncing = (state: OfflineSyncState) => state.isSyncing
const selectLastSyncTimestamp = (state: OfflineSyncState) => state.lastSyncTimestamp
const selectPendingOperationsCount = (state: OfflineSyncState) => state.operationQueue.length

/**
 * Hook to access network status
 * @returns NetworkState object containing online status and connection type
 * @example
 * ```tsx
 * function NetworkIndicator() {
 *   const { isOnline, connectionType } = useNetworkStatus()
 *   return (
 *     <div>
 *       {isOnline ? '🟢 Online' : '🔴 Offline'}
 *       {connectionType && ` (${connectionType})`}
 *     </div>
 *   )
 * }
 * ```
 */
export const useNetworkStatus = () => {
  return useOfflineSyncStore((state) => selectNetworkStatus(state))
}

/**
 * Hook to access sync operation queue
 * @returns Array of pending sync operations
 * @example
 * ```tsx
 * function SyncQueue() {
 *   const operations = useOperationQueue()
 *   return (
 *     <div>
 *       Pending operations: {operations.length}
 *     </div>
 *   )
 * }
 * ```
 */
export const useOperationQueue = () => {
  return useOfflineSyncStore((state) => selectOperationQueue(state))
}

/**
 * Hook to check sync status
 * @returns Object containing sync status information
 * @example
 * ```tsx
 * function SyncStatus() {
 *   const { isSyncing, lastSync, pendingCount } = useSyncStatus()
 *   return (
 *     <div>
 *       {isSyncing ? 'Syncing...' : `Last sync: ${lastSync}`}
 *       {pendingCount > 0 && ` (${pendingCount} pending)`}
 *     </div>
 *   )
 * }
 * ```
 */
export const useSyncStatus = () => {
  return useOfflineSyncStore((state) => ({
    isSyncing: selectIsSyncing(state),
    lastSync: selectLastSyncTimestamp(state),
    pendingCount: selectPendingOperationsCount(state)
  }))
} 