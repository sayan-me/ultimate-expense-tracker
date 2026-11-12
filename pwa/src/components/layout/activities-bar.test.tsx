import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ActivitiesBar } from './activities-bar'
import { renderWithProviders } from '@/tests/test-utils'
import { useActivities } from '@/contexts/activities-context'

// Test-only controls to drive state the bar itself doesn't expose buttons for
function Controls() {
  const { toggleMode, toggleCustomizationMode, isGroupMode, isCustomizing } = useActivities()
  return (
    <>
      <button onClick={() => toggleMode()}>test-toggle-mode</button>
      <button onClick={() => toggleCustomizationMode(true)}>test-customize</button>
      <span data-testid="state">{`${isGroupMode ? 'group' : 'personal'}:${isCustomizing ? 'customizing' : 'idle'}`}</span>
    </>
  )
}

const renderBar = () =>
  renderWithProviders(
    <>
      <ActivitiesBar />
      <Controls />
    </>
  )

const expandBar = () => fireEvent.click(screen.getByRole('button', { name: /expand activities/i }))

describe('ActivitiesBar', () => {
  it('renders in minimized state by default', () => {
    renderBar()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })

  it('expands when clicked', () => {
    renderBar()
    expandBar()
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collapse activities/i })).toBeInTheDocument()
  })

  it('shows personal mode activities by default', () => {
    renderBar()
    expandBar()
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()
    expect(screen.getByText('View Stats')).toBeInTheDocument()
    expect(screen.getByText('View Transactions')).toBeInTheDocument()
    expect(screen.queryByText('Log Group Transactions')).not.toBeInTheDocument()
  })

  it('gates group mode activities behind sign-in', () => {
    renderBar()
    fireEvent.click(screen.getByText('test-toggle-mode'))
    expect(screen.getByText('Group Activities')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /expand activities/i }))
    // Signed out (Firebase not configured): the fallback is shown, not the group actions
    expect(screen.queryByText('Log Group Transactions')).not.toBeInTheDocument()
    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })

  it('shows customization interface when in customize mode', () => {
    renderBar()
    fireEvent.click(screen.getByText('test-customize'))

    expect(screen.getByText('Customize Personal Quick Actions')).toBeInTheDocument()

    // Each activity can be added to or removed from the quick actions
    const toggleButtons = screen.getAllByRole('button', { name: /^(add|remove) /i })
    expect(toggleButtons.length).toBeGreaterThan(0)
  })

  it('closes and leaves customize mode when closed', () => {
    renderBar()
    fireEvent.click(screen.getByText('test-customize'))
    expect(screen.getByTestId('state')).toHaveTextContent('personal:customizing')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.getByTestId('state')).toHaveTextContent('personal:idle')
  })

  it('collapses when the overlay is clicked', () => {
    const { container } = renderBar()
    expandBar()
    expect(screen.getByText('Log Transactions')).toBeInTheDocument()

    const overlay = container.querySelector('div.fixed.inset-0') as HTMLElement
    fireEvent.click(overlay)

    expect(screen.queryByText('Log Transactions')).not.toBeInTheDocument()
  })
})
