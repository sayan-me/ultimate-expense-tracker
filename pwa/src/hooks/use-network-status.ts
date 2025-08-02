import { useEffect, useCallback } from 'react'
import { useOfflineSyncStore } from '@/stores/offline-sync'
import { getNetworkInfo } from '@/utils/network'

/**
 * Hook to monitor network status and update store
 * Provides universal support with progressive enhancement
 * 
 * @example
 * ```tsx
 * function App() {
 *   useNetworkStatus()
 *   return <div>Your app content</div>
 * }
 * ```
 * 
 * TODO: Update to use Capacitor Network API listeners when packaging as native app
 * Reference: https://capacitorjs.com/docs/apis/network#addlistener
 */

/** Browser's Network Information API type definition */
interface NetworkConnection {
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

export const useNetworkStatus = () => {
  const setNetworkStatus = useOfflineSyncStore(state => state.setNetworkStatus)

  // Memoize the update function to prevent unnecessary re-renders
  const updateNetworkStatus = useCallback(async () => {
    const networkInfo = await getNetworkInfo()
    setNetworkStatus(networkInfo)
  }, [setNetworkStatus])

  useEffect(() => {
    // Initial network status check
    updateNetworkStatus()

    // Universal online/offline events (works on all devices)
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Progressive enhancement: connection change events
    if ('connection' in navigator && navigator.connection) {
      (navigator.connection as NetworkConnection).addEventListener('change', updateNetworkStatus)
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if ('connection' in navigator && navigator.connection) {
        (navigator.connection as NetworkConnection).removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [updateNetworkStatus])
} 