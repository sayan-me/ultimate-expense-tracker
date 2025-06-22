import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock service worker
const serviceWorker = {
  register: vi.fn(),
}

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: serviceWorker,
  configurable: true
})

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
}) 