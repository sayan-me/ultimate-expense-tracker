import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountSelector } from '../account-selector'
import type { Account, Transaction } from '@/lib/db'

function account(overrides: Partial<Account> = {}): Account {
  return { id: 1, name: 'Cash', type: 'cash', openingBalance: 10000, createdAt: new Date(), ...overrides }
}

describe('AccountSelector', () => {
  it('shows each account with its live derived balance', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const accounts = [account({ id: 1, name: 'Cash' }), account({ id: 2, name: 'Bank', openingBalance: 50000 })]
    render(<AccountSelector value={undefined} onChange={vi.fn()} accounts={accounts} transactions={[]} />)

    await user.click(screen.getByText('Select account'))
    expect(screen.getByRole('option', { name: /Cash\s*\(\$100\.00\)/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Bank\s*\(\$500\.00\)/ })).toBeInTheDocument()
  })

  it('calls onChange with the numeric account id when an option is picked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onChange = vi.fn()
    const accounts = [account({ id: 1, name: 'Cash' }), account({ id: 2, name: 'Bank' })]
    render(<AccountSelector value={undefined} onChange={onChange} accounts={accounts} transactions={[]} />)

    await user.click(screen.getByText('Select account'))
    await user.click(screen.getByRole('option', { name: /Bank/ }))

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('excludes the account named in excludeAccountId (e.g. a transfer\'s already-chosen "from" account)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const accounts = [account({ id: 1, name: 'Cash' }), account({ id: 2, name: 'Bank' })]
    render(
      <AccountSelector
        value={undefined}
        onChange={vi.fn()}
        accounts={accounts}
        transactions={[]}
        excludeAccountId={1}
      />
    )

    await user.click(screen.getByText('Select account'))
    expect(screen.queryByRole('option', { name: /Cash/ })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Bank/ })).toBeInTheDocument()
  })

  it('reflects a derived balance that changes as transactions change', () => {
    const accounts = [account({ id: 1, name: 'Cash', openingBalance: 10000 })]
    const transactions: Transaction[] = [
      {
        id: 1,
        amount: 2500,
        type: 'expense',
        category: 'Food',
        description: '',
        date: new Date(),
        accountId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    render(<AccountSelector value={1} onChange={vi.fn()} accounts={accounts} transactions={transactions} />)
    expect(screen.getByRole('combobox')).toHaveTextContent(/\$75\.00/)
  })

  it('uses a custom placeholder when given', () => {
    render(
      <AccountSelector
        value={undefined}
        onChange={vi.fn()}
        accounts={[]}
        transactions={[]}
        placeholder="To account"
      />
    )
    expect(screen.getByText('To account')).toBeInTheDocument()
  })
})
