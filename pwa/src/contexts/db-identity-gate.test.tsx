import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DbIdentityGate } from './db-identity-gate'

const { mockSetActiveDbUser, mockResolveDbIdentity, mockMerge } = vi.hoisted(() => ({
  mockSetActiveDbUser: vi.fn(),
  mockResolveDbIdentity: vi.fn(),
  mockMerge: vi.fn(),
}))

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>()
  return { ...actual, setActiveDbUser: mockSetActiveDbUser }
})
vi.mock('@/lib/db-identity', () => ({ resolveDbIdentity: mockResolveDbIdentity }))
vi.mock('@/lib/db-merge', () => ({ mergeAnonymousDataIntoUserDb: mockMerge }))

vi.mock('@/contexts/db-context', () => ({
  DBProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="db-provider">{children}</div>,
}))

let mockAuth: { firebaseUser: { uid: string } | null; loading: boolean }
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuth,
}))

describe('DbIdentityGate', () => {
  beforeEach(() => {
    mockSetActiveDbUser.mockReset()
    mockResolveDbIdentity.mockReset()
    mockMerge.mockReset()
    mockMerge.mockResolvedValue(undefined)
    mockAuth = { firebaseUser: null, loading: true }
  })

  it('renders nothing while auth is still loading', () => {
    mockAuth = { firebaseUser: null, loading: true }
    render(<DbIdentityGate>children</DbIdentityGate>)
    expect(screen.queryByTestId('db-provider')).not.toBeInTheDocument()
    expect(mockResolveDbIdentity).not.toHaveBeenCalled()
  })

  it('switches to the anonymous db and renders children once auth settles with no user', async () => {
    mockResolveDbIdentity.mockResolvedValue({ action: 'use', key: 'anonymous' })
    mockAuth = { firebaseUser: null, loading: false }
    render(<DbIdentityGate>children</DbIdentityGate>)

    await waitFor(() => expect(screen.getByTestId('db-provider')).toBeInTheDocument())
    expect(mockSetActiveDbUser).toHaveBeenCalledWith('anonymous')
  })

  it('switches to the user\'s own db when the decision is "use" (returning user)', async () => {
    mockResolveDbIdentity.mockResolvedValue({ action: 'use', key: 'uid-123' })
    mockAuth = { firebaseUser: { uid: 'uid-123' }, loading: false }
    render(<DbIdentityGate>children</DbIdentityGate>)

    await waitFor(() => expect(screen.getByTestId('db-provider')).toBeInTheDocument())
    expect(mockSetActiveDbUser).toHaveBeenCalledWith('uid-123')
    expect(mockMerge).not.toHaveBeenCalled()
  })

  it('shows a confirmation prompt instead of rendering children when the decision is "prompt-merge"', async () => {
    mockResolveDbIdentity.mockResolvedValue({ action: 'prompt-merge', key: 'uid-123' })
    mockAuth = { firebaseUser: { uid: 'uid-123' }, loading: false }
    render(<DbIdentityGate>children</DbIdentityGate>)

    await waitFor(() => expect(screen.getByText(/found.*data on this device/i)).toBeInTheDocument())
    expect(screen.queryByTestId('db-provider')).not.toBeInTheDocument()
    expect(mockSetActiveDbUser).not.toHaveBeenCalled()
  })

  it('merges the data and switches to the user db when the prompt is accepted', async () => {
    const user = userEvent.setup()
    mockResolveDbIdentity.mockResolvedValue({ action: 'prompt-merge', key: 'uid-123' })
    mockAuth = { firebaseUser: { uid: 'uid-123' }, loading: false }
    render(<DbIdentityGate>children</DbIdentityGate>)
    await waitFor(() => expect(screen.getByText(/found.*data on this device/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /yes.*attach|attach.*account/i }))

    await waitFor(() => expect(screen.getByTestId('db-provider')).toBeInTheDocument())
    expect(mockMerge).toHaveBeenCalled()
    expect(mockSetActiveDbUser).toHaveBeenCalledWith('uid-123')
  })

  it('switches to the (empty) user db without merging when the prompt is declined', async () => {
    const user = userEvent.setup()
    mockResolveDbIdentity.mockResolvedValue({ action: 'prompt-merge', key: 'uid-123' })
    mockAuth = { firebaseUser: { uid: 'uid-123' }, loading: false }
    render(<DbIdentityGate>children</DbIdentityGate>)
    await waitFor(() => expect(screen.getByText(/found.*data on this device/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /no|start fresh|don't attach/i }))

    await waitFor(() => expect(screen.getByTestId('db-provider')).toBeInTheDocument())
    expect(mockMerge).not.toHaveBeenCalled()
    expect(mockSetActiveDbUser).toHaveBeenCalledWith('uid-123')
  })

  // Found live: if opening the local database hangs (e.g. a stuck
  // connection from another tab/debugger), resolveDbIdentity's promise
  // can simply never settle — without a timeout, that blanked the whole
  // app forever with zero feedback, no error, nothing to retry.
  it('shows an error with a retry option if identity resolution does not settle within a reasonable time', async () => {
    vi.useFakeTimers()
    try {
      mockResolveDbIdentity.mockReturnValue(new Promise(() => {})) // never resolves
      mockAuth = { firebaseUser: null, loading: false }
      render(<DbIdentityGate>children</DbIdentityGate>)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })

      expect(screen.getByText(/taking longer than expected|couldn't load|something went wrong/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('retries resolution when the retry button is clicked after a timeout', async () => {
    vi.useFakeTimers()
    try {
      mockResolveDbIdentity.mockReturnValue(new Promise(() => {}))
      mockAuth = { firebaseUser: null, loading: false }
      render(<DbIdentityGate>children</DbIdentityGate>)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })
    } finally {
      vi.useRealTimers()
    }

    mockResolveDbIdentity.mockReset()
    mockResolveDbIdentity.mockResolvedValue({ action: 'use', key: 'anonymous' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /retry|try again/i }))

    await waitFor(() => expect(screen.getByTestId('db-provider')).toBeInTheDocument())
  })
})
