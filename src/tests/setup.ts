import '@testing-library/jest-dom'
import { vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock service worker
const serviceWorker = {
  register: vi.fn(),
}

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: serviceWorker,
  configurable: true
}) 