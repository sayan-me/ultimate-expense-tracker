import * as React from "react"
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert } from './alert'

describe('Alert', () => {
  it('renders with default variant', () => {
    render(<Alert>Test message</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-background')
    expect(alert).toHaveTextContent('Test message')
  })

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Error message</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('border-destructive/50')
    expect(alert).toHaveTextContent('Error message')
  })

  it('applies custom className', () => {
    render(<Alert className="custom-class">Test message</Alert>)
    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Alert ref={ref}>Test message</Alert>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
}) 