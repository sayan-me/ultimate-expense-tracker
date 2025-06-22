/**
 * Network information utility with cross-platform support
 * Provides consistent network status detection for both iOS and Android
 */

/** Supported connection types */
export type ConnectionType = 'wifi' | 'cellular' | 'unknown'

/** Network Information API interface
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
interface NetworkInformation {
  type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  downlinkMax: number
  downlink: number
  rtt: number
  saveData: boolean
  onChange?: (event: Event) => void
}

/** Network information interface */
export interface NetworkInfo {
  isOnline: boolean
  connectionType: ConnectionType
  isStrongConnection: boolean
  lastChecked: number
}

/**
 * Get current network status across platforms
 * Uses multiple methods to detect connection type:
 * 1. Navigator online status (universal)
 * 2. Network Information API (Android)
 * 3. Performance API (iOS fallback)
 * 
 * @returns NetworkInfo object
 * 
 * TODO: Update implementation to use Capacitor Network API when packaging as native app
 * Reference: https://capacitorjs.com/docs/apis/network
 */
export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  const info: NetworkInfo = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    isStrongConnection: false,
    lastChecked: Date.now()
  }

  try {
    // Try Network Information API first (Android)
    if ('connection' in navigator && navigator.connection) {
      const connection = navigator.connection as NetworkInformation
      if (connection.type === 'wifi' || connection.type === 'ethernet') {
        info.connectionType = 'wifi'
        info.isStrongConnection = true
      } else if (connection.type === 'cellular' || /[234]g/.test(connection.effectiveType)) {
        info.connectionType = 'cellular'
        info.isStrongConnection = connection.effectiveType === '4g'
      }
    } 
    // Fallback: Use performance check for iOS
    else {
      const startTime = performance.now()
      try {
        // Fetch a static asset that's guaranteed to be cached by service worker
        const response = await fetch('/manifest.json', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        if (response.ok) {
          const endTime = performance.now()
          const responseTime = endTime - startTime
          
          // Determine connection type based on response time
          if (responseTime < 150) {
            info.connectionType = 'wifi'
            info.isStrongConnection = true
          } else {
            info.connectionType = 'cellular'
            info.isStrongConnection = responseTime < 300
          }
        }
      } catch (error) {
        // If fetch fails, we're either offline or have a very poor connection
        info.isOnline = false
        console.warn('Error fetching static asset:', error)
      }
    }
  } catch (error) {
    // Fallback to basic online/offline status
    console.warn('Error detecting network type:', error)
  }

  return info
}

/**
 * Check if current connection is suitable for data sync
 * @returns boolean indicating if sync is advisable
 */
export const isSyncSafeConnection = async (): Promise<boolean> => {
  const { isOnline, isStrongConnection, connectionType } = await getNetworkInfo()
  
  // Always allow sync on WiFi
  if (connectionType === 'wifi') return true
  
  // On cellular, only sync with strong connection
  if (connectionType === 'cellular') return isStrongConnection
  
  // Unknown connection type, fall back to online status
  return isOnline
} 