import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Header } from './header'
import { renderWithProviders } from '@/tests/test-utils'

let mockPathname = '/'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  usePathname: () => mockPathname,
}))

describe('Header Component', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('does not show a back button on the home page', () => {
    renderWithProviders(<Header />)
    expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument()
  })

  it('shows a back button on any other page', () => {
    mockPathname = '/history'
    renderWithProviders(<Header />)
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('renders header with a generic greeting when signed out', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText(/^Good (morning|afternoon|evening)!$/)).toBeInTheDocument()
  })

  it('displays current date', () => {
    renderWithProviders(<Header />)
    const date = screen.getByText(/\w+, \w+ \d+(?:st|nd|rd|th)/)
    expect(date).toBeInTheDocument()
  })

  it('contains mode toggle and user navigation', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument()
  })

  it('does not rely on a fixed height for the content row, so wrapped greeting text is not clipped', () => {
    const { container } = renderWithProviders(<Header />)
    const header = container.querySelector('header')
    const contentRow = header?.firstElementChild
    expect(contentRow).toBeTruthy()
    const classList = contentRow?.className.split(/\s+/) ?? []
    // A fixed h-14 height would clip a greeting that wraps to two lines on
    // narrow viewports. Growing with min-h-14 instead lets the row expand.
    expect(classList).not.toContain('h-14')
    expect(classList).toContain('min-h-14')
  })
}) 