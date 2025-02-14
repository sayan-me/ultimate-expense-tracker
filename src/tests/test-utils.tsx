import { render } from '@testing-library/react'
import { DBProvider } from '@/contexts/db-context'
import { useAuthStore } from '@/stores/auth'
import { useFeatureGatesStore } from '@/stores/feature-gates'
import { usePreferencesStore } from '@/stores/preferences'
import { useUIStore } from '@/stores/ui'
import type { StoreApi } from 'zustand/vanilla'
import { expect } from 'vitest'

// Reset all stores between tests
export function resetStores() {
  useAuthStore.getState().resetAuth()
  useFeatureGatesStore.getState().resetFeatureGates()
  usePreferencesStore.getState().resetPreferences()
  useUIStore.getState().resetUI()
}

export function renderWithProviders(ui: React.ReactElement) {
  resetStores()
  return render(<DBProvider>{ui}</DBProvider>)
}

// Define the matcher result type
interface MatcherResult {
  pass: boolean
  message: () => string
}

// Define the custom matcher interface
interface CustomMatchers<R = unknown> {
  toBeInStore(store: StoreApi<unknown>, path: string): R extends void ? MatcherResult : R
}

// Extend Vitest's interfaces
declare module 'vitest' {
  interface Assertion extends CustomMatchers<void> {
    toBeInStore(store: StoreApi<unknown>, path: string): void
  }
  interface AsymmetricMatchersContaining extends CustomMatchers<void> {
    toBeInStore(store: StoreApi<unknown>, path: string): void
  }
}

expect.extend({
  toBeInStore(received: unknown, store: StoreApi<unknown>, path: string) {
    const storeValue = path.split('.').reduce((obj: unknown, key: string) => 
      obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined
    , store.getState())
    const pass = this.equals(received, storeValue)
    
    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received} not to be in store at path ${path}`
          : `Expected ${received} to be in store at path ${path}`
    }
  }
}) 