import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackButton } from './back-button'

// No app-level back/home navigation existed anywhere in the PWA: no back
// arrow, no clickable logo, no breadcrumb — the only way off a page like
// /auth/login was the browser's own back button. This component closes
// that gap.
let mockPathname = '/'
const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  usePathname: () => mockPathname,
}))

describe('BackButton', () => {
  beforeEach(() => {
    mockPathname = '/'
    mockBack.mockReset()
    mockPush.mockReset()
  })

  it('renders nothing on the home route', () => {
    mockPathname = '/'
    const { container } = render(<BackButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(['/history', '/settings', '/settings/account', '/auth/login', '/notifications', '/offline'])(
    'renders a back button on %s',
    (path) => {
      mockPathname = path
      render(<BackButton />)
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
    }
  )

  it('goes back in history when there is somewhere to go back to', async () => {
    mockPathname = '/history'
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      configurable: true,
    })
    const user = userEvent.setup()
    render(<BackButton />)

    await user.click(screen.getByRole('button', { name: /go back/i }))

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('falls back to navigating home when there is no history to go back to', async () => {
    // e.g. the user opened /history directly (deep link, new tab,
    // installed-PWA cold start) — router.back() would do nothing.
    mockPathname = '/history'
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      configurable: true,
    })
    const user = userEvent.setup()
    render(<BackButton />)

    await user.click(screen.getByRole('button', { name: /go back/i }))

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('has a 44x44 tap target regardless of the icon size', () => {
    mockPathname = '/history'
    render(<BackButton />)
    const button = screen.getByRole('button', { name: /go back/i })
    expect(button.className).toMatch(/h-11/)
    expect(button.className).toMatch(/w-11/)
  })
})
