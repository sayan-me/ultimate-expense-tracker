import { render } from '@testing-library/react'
import { AuthProvider } from '@/contexts/auth-context'
import { ActivitiesProvider } from '@/contexts/activities-context'
import { useAuthStore } from '@/stores/auth'
import type { StoreApi } from 'zustand/vanilla'
import { expect } from 'vitest'

// Reset all stores between tests
export function resetStores() {
  useAuthStore.getState().resetAuth()
}

/**
 * Wraps UI in the app-level React contexts that don't touch IndexedDB.
 * Auth runs in signed-out mode (Firebase is not configured under test).
 * Tests that need DB data should vi.mock('@/contexts/db-context').
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActivitiesProvider>{children}</ActivitiesProvider>
    </AuthProvider>
  )
}

export function renderWithProviders(ui: React.ReactElement) {
  resetStores()
  return render(ui, { wrapper: AllProviders })
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

/** The datetime-local input rendered by AddExpenseForm. */
export function getDateInput(): HTMLInputElement {
  const el = document.querySelector('input[type="datetime-local"]')
  if (!el) throw new Error('datetime-local input not found')
  return el as HTMLInputElement
}
