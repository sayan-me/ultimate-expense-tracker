import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

// jsdom lacks these browser APIs (used by Radix UI, cmdk and our scroll-area)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserverStub, configurable: true })
}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = vi.fn()
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = vi.fn(() => false)
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = vi.fn()
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = vi.fn()

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
// next/navigation hooks need the App Router at runtime; stub them for unit tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
