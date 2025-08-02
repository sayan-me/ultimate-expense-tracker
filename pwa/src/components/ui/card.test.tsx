import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription } from './card'

describe('Card Component', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
      </Card>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Card className="test-class">
        <CardHeader>Content</CardHeader>
      </Card>
    )

    expect(screen.getByText('Content').parentElement).toHaveClass('test-class')
  })
}) 