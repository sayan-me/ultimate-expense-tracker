import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { authService } from '@/services/auth.service'

vi.mock('@/services/auth.service', () => ({
  authService: { getIdToken: vi.fn() },
}))

vi.mock('@/config/env', () => ({
  env: { api: { userServiceUrl: 'https://example-user-service.test' } },
}))

function okResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response
}

describe('useOfflineSyncStore', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    await db.transactions.clear()
    await db.accounts.clear()
    await db.categories.clear()
    await db.budgets.clear()
    await db.recurringTransactions.clear()

    ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue('fake-id-token')

    fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/sync/pull')) return okResponse({ records: [] })
      if (url.includes('/sync/push')) return okResponse({ pushed: 0, skipped: 0 })
      throw new Error(`Unexpected fetch: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { useOfflineSyncStore } = await import('./offline-sync')
    useOfflineSyncStore.setState({ isOnline: true, lastSyncedAt: null, syncStatus: 'idle', lastError: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('setOnline updates isOnline', async () => {
    const { useOfflineSyncStore } = await import('./offline-sync')
    useOfflineSyncStore.getState().setOnline(false)
    expect(useOfflineSyncStore.getState().isOnline).toBe(false)
  })

  it('syncNow pulls a new budget from the server and writes it into Dexie', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('table=budgets') && url.includes('/sync/pull')) {
        return okResponse({
          records: [
            {
              syncId: 'bud-1',
              category: null,
              amount: 50000,
              createdAt: '2026-11-01T00:00:00.000Z',
              updatedAt: '2026-11-01T00:00:00.000Z',
              deletedAt: null,
            },
          ],
        })
      }
      if (url.includes('/sync/pull')) return okResponse({ records: [] })
      return okResponse({ pushed: 0, skipped: 0 })
    })

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const budgets = await db.budgets.toArray()
    expect(budgets).toHaveLength(1)
    expect(budgets[0]).toMatchObject({ syncId: 'bud-1', amount: 50000 })
  })

  it('syncNow pushes a local budget that has never been synced', async () => {
    await db.budgets.add({
      syncId: 'bud-local-1',
      category: 'Food',
      amount: 10000,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    })

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const pushCall = fetchMock.mock.calls.find(
      ([url]: [string]) => url.includes('/sync/push')
    ) as [string, RequestInit] | undefined
    expect(pushCall).toBeDefined()
  })

  it('pulls accounts before transactions, so a pulled transaction can resolve its account', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('table=accounts') && url.includes('/sync/pull')) {
        return okResponse({
          records: [
            {
              syncId: 'acc-1',
              name: 'Cash',
              type: 'cash',
              openingBalance: 0,
              isDefault: true,
              createdAt: '2026-11-01T00:00:00.000Z',
              updatedAt: '2026-11-01T00:00:00.000Z',
              deletedAt: null,
            },
          ],
        })
      }
      if (url.includes('table=transactions') && url.includes('/sync/pull')) {
        return okResponse({
          records: [
            {
              syncId: 'tx-1',
              accountSyncId: 'acc-1',
              amount: 1000,
              type: 'expense',
              category: 'Food',
              description: '',
              date: '2026-11-01T00:00:00.000Z',
              createdAt: '2026-11-01T00:00:00.000Z',
              updatedAt: '2026-11-01T00:00:00.000Z',
              deletedAt: null,
            },
          ],
        })
      }
      if (url.includes('/sync/pull')) return okResponse({ records: [] })
      return okResponse({ pushed: 0, skipped: 0 })
    })

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const [account] = await db.accounts.toArray()
    const [transaction] = await db.transactions.toArray()
    expect(account.syncId).toBe('acc-1')
    expect(transaction.syncId).toBe('tx-1')
    expect(transaction.accountId).toBe(account.id)
  })

  it('updates lastSyncedAt and syncStatus after a successful sync', async () => {
    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const state = useOfflineSyncStore.getState()
    expect(state.syncStatus).toBe('idle')
    expect(state.lastSyncedAt).toBeInstanceOf(Date)
    expect(state.lastError).toBeNull()
  })

  it('sets syncStatus to error and records the message when a sync fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'))

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const state = useOfflineSyncStore.getState()
    expect(state.syncStatus).toBe('error')
    expect(state.lastError).toMatch(/network down/i)
  })

  it('does nothing when there is no signed-in user (no id token)', async () => {
    ;(authService.getIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Reported in live multi-device use: pushing ~3,500 real transactions in
  // one request hung indefinitely server-side and eventually errored out.
  // The backend fix (see sync.ts) now handles an arbitrarily large payload
  // efficiently either way, but splitting the push into multiple
  // reasonably-sized requests client-side adds a second layer of safety
  // (bounded payload size, a failure only loses one batch) rather than
  // depending entirely on the backend to cope with one unbounded request.
  it('splits a large push into multiple requests instead of one unbounded request', async () => {
    const rows = Array.from({ length: 251 }, (_, i) => ({
      syncId: `bud-${i}`,
      category: `Category ${i}`,
      amount: 1000,
      createdAt: new Date('2026-11-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    }))
    await db.budgets.bulkAdd(rows)

    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const pushCalls = fetchMock.mock.calls.filter(([url]: [string]) => url.includes('/sync/push'))
    const budgetPushCalls = pushCalls.filter(([, options]: [string, RequestInit]) => {
      const body = JSON.parse(options.body as string) as { table: string }
      return body.table === 'budgets'
    })

    expect(budgetPushCalls.length).toBeGreaterThanOrEqual(2)
    const totalRecordsSent = budgetPushCalls.reduce((sum: number, [, options]: [string, RequestInit]) => {
      const body = JSON.parse(options.body as string) as { records: unknown[] }
      return sum + body.records.length
    }, 0)
    expect(totalRecordsSent).toBe(251)
  })

  it('sends the id token as a bearer header', async () => {
    const { useOfflineSyncStore } = await import('./offline-sync')
    await useOfflineSyncStore.getState().syncNow()

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer fake-id-token')
  })
})
