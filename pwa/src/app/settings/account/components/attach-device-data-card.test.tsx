import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttachDeviceDataCard } from './attach-device-data-card'

const mockAnonymousDataExists = vi.fn()
const mockMerge = vi.fn()
const mockGetDb = vi.fn()

vi.mock('@/lib/db-identity', () => ({ anonymousDataExists: () => mockAnonymousDataExists() }))
vi.mock('@/lib/db-merge', () => ({ mergeAnonymousDataIntoUserDb: (...args: unknown[]) => mockMerge(...args) }))
vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>()
  return { ...actual, getDb: () => mockGetDb(), dbNameForUserKey: actual.dbNameForUserKey, ANONYMOUS_DB_KEY: actual.ANONYMOUS_DB_KEY }
})

describe('AttachDeviceDataCard', () => {
  beforeEach(() => {
    mockAnonymousDataExists.mockReset()
    mockMerge.mockReset()
    mockMerge.mockResolvedValue(undefined)
    mockGetDb.mockReset()
    mockGetDb.mockReturnValue({ name: 'ExpenseTrackerDB_uid-123' })
  })

  it('renders nothing when there is no unattached device data', async () => {
    mockAnonymousDataExists.mockResolvedValue(false)
    render(<AttachDeviceDataCard />)

    await waitFor(() => expect(mockAnonymousDataExists).toHaveBeenCalled())
    expect(screen.queryByText(/device data/i)).not.toBeInTheDocument()
  })

  it('shows a card with an attach action when there is unattached device data', async () => {
    mockAnonymousDataExists.mockResolvedValue(true)
    render(<AttachDeviceDataCard />)

    expect(await screen.findByRole('button', { name: /attach/i })).toBeInTheDocument()
  })

  it('merges the device data into the current account after confirming', async () => {
    const user = userEvent.setup()
    mockAnonymousDataExists.mockResolvedValue(true)
    render(<AttachDeviceDataCard />)
    await screen.findByRole('button', { name: /attach/i })

    await user.click(screen.getByRole('button', { name: /attach/i }))
    await user.click(screen.getByRole('button', { name: /confirm|yes/i }))

    await waitFor(() => expect(mockMerge).toHaveBeenCalled())
  })

  it('hides itself after a successful attach (there is no more unattached data)', async () => {
    const user = userEvent.setup()
    mockAnonymousDataExists.mockResolvedValue(true)
    render(<AttachDeviceDataCard />)
    await screen.findByRole('button', { name: /attach/i })

    await user.click(screen.getByRole('button', { name: /attach/i }))
    await user.click(screen.getByRole('button', { name: /confirm|yes/i }))

    await waitFor(() => expect(screen.queryByRole('button', { name: /^attach/i })).not.toBeInTheDocument())
  })
})
