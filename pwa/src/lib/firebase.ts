import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { env, validateEnvConfig, logEnvStatus } from '@/config/env';

// Validate environment configuration on import
const envValidation = validateEnvConfig();
if (!envValidation.isValid) {
  console.error('🔥 Firebase configuration error:', envValidation.errors);
  throw new Error(`Firebase configuration error: ${envValidation.errors.join(', ')}`);
}

// Log environment status in development
logEnvStatus();

// Firebase configuration using validated environment variables
const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Functions and get a reference to the service
export const functions = getFunctions(app);

// Connect to emulators in development
if (env.app.isDevelopment && typeof window !== 'undefined') {
  // Only connect to emulators on client-side in development
  const isEmulatorConnected = (window as { __FIREBASE_EMULATOR_CONNECTED__?: boolean }).__FIREBASE_EMULATOR_CONNECTED__ ?? false;
  
  if (!isEmulatorConnected) {
    // Connect to Firebase Auth emulator if running locally
    if (env.development.useFirebaseEmulator) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('🔥 Connected to Firebase emulators');
    }
    (window as { __FIREBASE_EMULATOR_CONNECTED__?: boolean }).__FIREBASE_EMULATOR_CONNECTED__ = true;
  }
}

// Export types for better TypeScript support
export type { User } from 'firebase/auth';
export type { Functions } from 'firebase/functions';