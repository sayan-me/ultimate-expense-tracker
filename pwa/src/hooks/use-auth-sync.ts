import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAuthStore } from '@/stores/auth';

/**
 * Hook to sync authentication context with Zustand auth store
 * This ensures that both the React context and Zustand store stay in sync
 */
export function useAuthSync() {
  const { user, loading } = useAuth();
  const { setAuthenticated, setUserLevel, setUserId, resetAuth } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated - sync with store
        setAuthenticated(true);
        setUserLevel(user.featureLevel);
        setUserId(user.id);
      } else {
        // User is not authenticated - reset store
        resetAuth();
      }
    }
  }, [user, loading, setAuthenticated, setUserLevel, setUserId, resetAuth]);
}

/**
 * Enhanced hook that provides both context and store auth data
 * Use this when you need access to both authentication state sources
 */
export function useAuthState() {
  const contextAuth = useAuth();
  const storeAuth = useAuthStore();
  
  // Sync the stores
  useAuthSync();

  return {
    // Context data (real-time Firebase auth)
    context: contextAuth,
    // Store data (persisted, for feature gates)
    store: storeAuth,
    // Convenience flags
    isAuthenticated: !!contextAuth.user && storeAuth.isAuthenticated,
    userLevel: contextAuth.user?.featureLevel || storeAuth.userLevel,
    userId: contextAuth.user?.id || storeAuth.userId,
  };
}