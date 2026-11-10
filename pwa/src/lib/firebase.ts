import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { env, validateEnvConfig } from '@/config/env';

/**
 * Firebase is optional. The app works fully offline/local without it; Firebase
 * is only needed for sign-in. Nothing here throws at import time and nothing
 * is initialised until getFirebaseApp()/getFirebaseAuth() is called.
 */

/** True when the NEXT_PUBLIC_FIREBASE_* variables required for auth are set. */
export const isFirebaseConfigured: boolean = validateEnvConfig().isValid;

let authInstance: Auth | null = null;

/** Returns the Firebase app, or null if Firebase is not configured. */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
  });
}

/** Returns Firebase Auth (lazily initialised), or null if Firebase is not configured. */
export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;

  authInstance = getAuth(app);

  if (env.app.isDevelopment && env.development.useFirebaseEmulator && typeof window !== 'undefined') {
    const w = window as { __FIREBASE_EMULATOR_CONNECTED__?: boolean };
    if (!w.__FIREBASE_EMULATOR_CONNECTED__) {
      connectAuthEmulator(authInstance, 'http://localhost:9099');
      w.__FIREBASE_EMULATOR_CONNECTED__ = true;
    }
  }
  return authInstance;
}

export type { User } from 'firebase/auth';
