import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from './page'

// Page-level test: just confirm the real DataManagement component is
// what renders for this section, not "Coming soon..." like the other
// still-unimplemented sections. DataManagement's own behavior is
// covered by its own test file.
vi.mock('@/components/settings/data-management', () => ({
  DataManagement: () => <div data-testid="data-management-stub">Data Management Stub</div>,
}))

describe('SettingsPage', () => {
  it('renders the real Data Management component when that section is expanded', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByText('Data Management'))

    expect(screen.getByTestId('data-management-stub')).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('still shows "Coming soon..." for sections that are not yet implemented', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByText('Notification Preferences'))

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })

  it('collapses the Data Management section on a second click', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByText('Data Management'))
    expect(screen.getByTestId('data-management-stub')).toBeInTheDocument()

    await user.click(screen.getByText('Data Management'))
    expect(screen.queryByTestId('data-management-stub')).not.toBeInTheDocument()
  })
})
