import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserNav } from './user-nav'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

let mockAuth: { user: { name: string; email: string } | null; logout: () => Promise<void> }
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuth,
}))

describe('UserNav', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockAuth = { user: null, logout: vi.fn().mockResolvedValue(undefined) }
  })

  it('shows a Settings menu item when not logged in', async () => {
    const user = userEvent.setup()
    render(<UserNav />)

    await user.click(screen.getByRole('button', { name: /open user menu/i }))

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('navigates to /settings when Settings is clicked while logged out', async () => {
    const user = userEvent.setup()
    render(<UserNav />)

    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    await user.click(screen.getByText('Settings'))

    expect(mockPush).toHaveBeenCalledWith('/settings')
  })

  it('still shows a Settings menu item when logged in', async () => {
    mockAuth = {
      user: { name: 'Sayan', email: 'sayan@uet.com' },
      logout: vi.fn().mockResolvedValue(undefined),
    }
    const user = userEvent.setup()
    render(<UserNav />)

    await user.click(screen.getByRole('button', { name: /open user menu/i }))

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows Log in when logged out and Log out when logged in', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<UserNav />)
    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    expect(screen.getByText('Log in')).toBeInTheDocument()
    unmount()

    mockAuth = {
      user: { name: 'Sayan', email: 'sayan@uet.com' },
      logout: vi.fn().mockResolvedValue(undefined),
    }
    render(<UserNav />)
    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    expect(screen.getByText('Log out')).toBeInTheDocument()
  })
})
