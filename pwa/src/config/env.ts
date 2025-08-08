/**
 * Environment configuration helper
 * Centralizes all environment variable access with validation
 */

// Required environment variables for core functionality
const requiredEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
} as const;

// Optional environment variables with defaults
const optionalEnvVars = {
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  NEXT_PUBLIC_USER_SERVICE_URL: process.env.NEXT_PUBLIC_USER_SERVICE_URL || '',
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
  NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Ultimate Expense Tracker',
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
} as const;

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Environment configuration object
 */
export const env = {
  // Firebase configuration
  firebase: {
    apiKey: requiredEnvVars.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: requiredEnvVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: requiredEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: optionalEnvVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: optionalEnvVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: optionalEnvVars.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  
  // API configuration (optional for core features)
  api: {
    userServiceUrl: optionalEnvVars.NEXT_PUBLIC_USER_SERVICE_URL,
  },
  
  // Development configuration
  development: {
    useFirebaseEmulator: optionalEnvVars.NEXT_PUBLIC_USE_FIREBASE_EMULATOR,
    debugMode: optionalEnvVars.NEXT_PUBLIC_DEBUG_MODE,
  },
  
  // Application configuration
  app: {
    name: optionalEnvVars.NEXT_PUBLIC_APP_NAME,
    version: optionalEnvVars.NEXT_PUBLIC_APP_VERSION,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
} as const;

/**
 * Validate environment configuration
 */
export function validateEnvConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  const { isValid, missingVars } = validateRequiredEnvVars();
  
  if (!isValid) {
    errors.push(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate Firebase Auth Domain format
  if (env.firebase.authDomain && !env.firebase.authDomain.includes('.firebaseapp.com')) {
    warnings.push('Firebase Auth Domain should end with .firebaseapp.com');
  }
  
  // Validate User Service URL format (if provided)
  if (env.api.userServiceUrl) {
    if (!env.api.userServiceUrl.startsWith('https://')) {
      warnings.push('User Service URL should use HTTPS in production');
    }
  } else {
    warnings.push('User Service URL not configured - authentication features will be unavailable');
  }
  
  // Development warnings
  if (env.app.isProduction && env.development.debugMode) {
    warnings.push('Debug mode is enabled in production');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log environment status (development only)
 */
export function logEnvStatus(): void {
  if (!env.app.isDevelopment) return;
  
  const validation = validateEnvConfig();
  
  console.group('🌍 Environment Configuration');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('App Name:', env.app.name);
  console.log('App Version:', env.app.version);
  console.log('Firebase Project:', env.firebase.projectId);
  console.log('User Service URL:', env.api.userServiceUrl || '❌ Not configured');
  console.log('User Service Status:', env.api.userServiceUrl ? '✅ Available' : '⚠️ Authentication features disabled');
  console.log('Debug Mode:', env.development.debugMode);
  console.log('Firebase Emulator:', env.development.useFirebaseEmulator);
  
  if (validation.errors.length > 0) {
    console.error('❌ Configuration Errors:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:', validation.warnings);
  }
  
  if (validation.isValid) {
    console.log('✅ Configuration is valid');
  }
  
  console.groupEnd();
}