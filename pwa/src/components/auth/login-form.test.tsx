import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockClearError = vi.fn()
let mockAuth: {
  login: typeof mockLogin
  register: typeof mockRegister
  loading: boolean
  error: string | null
  clearError: typeof mockClearError
  isAuthConfigured: boolean
}

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuth,
}))

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockRegister.mockReset()
    mockClearError.mockReset()
    mockAuth = { login: mockLogin, register: mockRegister, loading: false, error: null, clearError: mockClearError, isAuthConfigured: true }
  })

  it('masks the password by default and reveals it when the show/hide toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const password = screen.getByLabelText(/^password$/i)
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /hide password/i }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('does not show a confirm-password field in sign-in mode', () => {
    render(<LoginForm />)
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument()
  })

  it('shows a confirm-password field in create-account mode', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole('button', { name: /don't have an account/i }))
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('blocks registration and shows an error when the passwords do not match', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole('button', { name: /don't have an account/i }))

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password124')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText(/passwords.*match/i)).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('registers when the passwords match', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole('button', { name: /don't have an account/i }))

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(mockRegister).toHaveBeenCalledWith('jane@example.com', 'password123', 'Jane Doe')
  })

  it('logs in without requiring a confirm-password field', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockLogin).toHaveBeenCalledWith('jane@example.com', 'password123')
  })
})
