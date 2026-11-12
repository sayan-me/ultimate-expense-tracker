import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurrencySettingsCard } from './currency-settings-card'
import { usePreferencesStore } from '@/stores/preferences'

describe('CurrencySettingsCard', () => {
  afterEach(() => {
    usePreferencesStore.setState({ currency: 'USD' })
  })

  it('shows the current currency (USD by default) as the selected value', () => {
    render(<CurrencySettingsCard />)

    expect(screen.getByRole('combobox')).toHaveTextContent('USD')
  })

  it('lists the supported currencies as options when opened', async () => {
    const user = userEvent.setup()
    render(<CurrencySettingsCard />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByRole('option', { name: /INR/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /EUR/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /GBP/i })).toBeInTheDocument()
  })

  it('updates the preferences store when a different currency is selected', async () => {
    const user = userEvent.setup()
    render(<CurrencySettingsCard />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /INR/i }))

    expect(usePreferencesStore.getState().currency).toBe('INR')
  })

  it('reflects the currently selected currency even when set before mount', () => {
    usePreferencesStore.getState().setCurrency('EUR')
    render(<CurrencySettingsCard />)

    expect(screen.getByRole('combobox')).toHaveTextContent('EUR')
  })
})
