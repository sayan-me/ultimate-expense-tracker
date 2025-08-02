import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Header } from './header'
import { renderWithProviders } from '@/tests/test-utils'

describe('Header Component', () => {
  it('renders header with user greeting', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText(/Hello, User!/)).toBeInTheDocument()
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