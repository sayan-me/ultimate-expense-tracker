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
}) 