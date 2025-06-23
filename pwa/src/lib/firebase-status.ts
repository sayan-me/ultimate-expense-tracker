import { app, auth, functions } from './firebase';
import { validateEnvConfig } from '@/config/env';

/**
 * Check if Firebase is properly configured
 */
export function checkFirebaseConfig(): {
  isConfigured: boolean;
  missingVars: string[];
  status: string;
} {
  const validation = validateEnvConfig();
  
  const status = validation.isValid 
    ? 'Configured and ready'
    : `Configuration errors: ${validation.errors.join(', ')}`;

  return {
    isConfigured: validation.isValid,
    missingVars: validation.errors,
    status,
  };
}

/**
 * Get Firebase app status for debugging
 */
export function getFirebaseStatus() {
  const config = checkFirebaseConfig();
  
  return {
    app: {
      name: app.name,
      options: app.options,
    },
    auth: {
      currentUser: auth.currentUser?.email || 'No user signed in',
    },
    functions: {
      app: functions.app.name,
      region: 'us-central1', // Default region
    },
    config,
  };
}

/**
 * Development helper to log Firebase status
 */
export function logFirebaseStatus() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 Firebase Status:', getFirebaseStatus());
  }
}