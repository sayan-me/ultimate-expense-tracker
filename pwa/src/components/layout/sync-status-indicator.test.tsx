import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncStatusIndicator } from './sync-status-indicator'
import { useOfflineSyncStore } from '@/stores/offline-sync'

describe('SyncStatusIndicator', () => {
  const reset = () =>
    useOfflineSyncStore.setState({ isOnline: true, lastSyncedAt: null, syncStatus: 'idle', lastError: null })

  it('renders nothing before any sync has happened (e.g. no one signed in)', () => {
    reset()
    render(<SyncStatusIndicator />)
    expect(screen.queryByTestId('sync-status-indicator')).not.toBeInTheDocument()
  })

  it('shows an offline state when isOnline is false', () => {
    reset()
    useOfflineSyncStore.setState({ isOnline: false })
    render(<SyncStatusIndicator />)
    expect(screen.getByTestId('sync-status-indicator')).toHaveAttribute('title', expect.stringMatching(/offline/i))
  })

  it('shows a syncing state while a sync is in progress', () => {
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'syncing' })
    render(<SyncStatusIndicator />)
    expect(screen.getByTestId('sync-status-indicator')).toHaveAttribute('title', expect.stringMatching(/syncing/i))
  })

  it('shows an error state with the error message when the last sync failed', () => {
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'error', lastError: 'Network down' })
    render(<SyncStatusIndicator />)
    expect(screen.getByTestId('sync-status-indicator')).toHaveAttribute('title', expect.stringContaining('Network down'))
  })

  it('shows a synced state once a sync has completed', () => {
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'idle', lastSyncedAt: new Date() })
    render(<SyncStatusIndicator />)
    expect(screen.getByTestId('sync-status-indicator')).toHaveAttribute('title', expect.stringMatching(/synced/i))
  })

  it('prioritizes the offline state even if a previous sync had succeeded', () => {
    reset()
    useOfflineSyncStore.setState({ isOnline: false, lastSyncedAt: new Date(), syncStatus: 'idle' })
    render(<SyncStatusIndicator />)
    expect(screen.getByTestId('sync-status-indicator')).toHaveAttribute('title', expect.stringMatching(/offline/i))
  })

  // Reported live: sync can fail (or just be stale) with no way to
  // manually retry — the indicator was purely a status display.
  it('retriggers a sync when clicked after a failure', async () => {
    const user = userEvent.setup()
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'error', lastError: 'Network down' })
    const syncNow = vi.fn()
    useOfflineSyncStore.setState({ syncNow })

    render(<SyncStatusIndicator />)
    await user.click(screen.getByRole('button', { name: /retry sync/i }))

    expect(syncNow).toHaveBeenCalled()
  })

  it('is also clickable to manually re-sync when idle/synced, not only after an error', async () => {
    const user = userEvent.setup()
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'idle', lastSyncedAt: new Date() })
    const syncNow = vi.fn()
    useOfflineSyncStore.setState({ syncNow })

    render(<SyncStatusIndicator />)
    await user.click(screen.getByRole('button', { name: /sync now/i }))

    expect(syncNow).toHaveBeenCalled()
  })

  it('does not offer a clickable retry while offline (nothing to retry against)', () => {
    reset()
    useOfflineSyncStore.setState({ isOnline: false })
    render(<SyncStatusIndicator />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not offer a clickable retry while a sync is already in progress', () => {
    reset()
    useOfflineSyncStore.setState({ syncStatus: 'syncing' })
    render(<SyncStatusIndicator />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
