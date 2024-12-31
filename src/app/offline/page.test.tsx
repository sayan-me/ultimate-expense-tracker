import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflinePage from './page'

describe('OfflinePage', () => {
  it('renders offline message', () => {
    render(<OfflinePage />)
    
    expect(screen.getByText("You're Offline")).toBeInTheDocument()
    expect(screen.getByText(/Don't worry!/)).toBeInTheDocument()
  })

  it('shows available offline features', () => {
    render(<OfflinePage />)
    
    expect(screen.getByText(/View your expenses/)).toBeInTheDocument()
    expect(screen.getByText(/Add new transactions/)).toBeInTheDocument()
    expect(screen.getByText(/Check your budgets/)).toBeInTheDocument()
  })

  it('has a working continue button', () => {
    render(<OfflinePage />)
    
    const button = screen.getByRole('link', { name: /Continue Offline/i })
    expect(button).toHaveAttribute('href', '/')
  })
}) 