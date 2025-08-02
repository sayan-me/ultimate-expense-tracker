import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChangePasswordForm } from '../change-password-form'
import { authService } from '@/services/auth.service'

// Mock the auth service
jest.mock('@/services/auth.service', () => ({
  authService: {
    changePassword: jest.fn(),
  },
}))

const mockChangePassword = authService.changePassword as jest.MockedFunction<typeof authService.changePassword>

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders password form fields', () => {
    render(<ChangePasswordForm />)
    
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change password/i })).toBeDisabled()
  })

  it('enables submit button when all fields are filled', () => {
    render(<ChangePasswordForm />)
    
    fireEvent.change(screen.getByLabelText(/current password/i), { 
      target: { value: 'currentpass' } 
    })
    fireEvent.change(screen.getByLabelText(/new password/i), { 
      target: { value: 'newpass123' } 
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
      target: { value: 'newpass123' } 
    })
    
    expect(screen.getByRole('button', { name: /change password/i })).not.toBeDisabled()
  })

  it('shows error when passwords do not match', async () => {
    render(<ChangePasswordForm />)
    
    fireEvent.change(screen.getByLabelText(/current password/i), { 
      target: { value: 'currentpass' } 
    })
    fireEvent.change(screen.getByLabelText(/new password/i), { 
      target: { value: 'newpass123' } 
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
      target: { value: 'differentpass' } 
    })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeInTheDocument()
    })
  })

  it('shows error when new password is too short', async () => {
    render(<ChangePasswordForm />)
    
    fireEvent.change(screen.getByLabelText(/current password/i), { 
      target: { value: 'currentpass' } 
    })
    fireEvent.change(screen.getByLabelText(/new password/i), { 
      target: { value: '123' } 
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
      target: { value: '123' } 
    })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('New password must be at least 6 characters long')).toBeInTheDocument()
    })
  })

  it('successfully changes password', async () => {
    mockChangePassword.mockResolvedValueOnce(undefined)
    
    render(<ChangePasswordForm />)
    
    fireEvent.change(screen.getByLabelText(/current password/i), { 
      target: { value: 'currentpass' } 
    })
    fireEvent.change(screen.getByLabelText(/new password/i), { 
      target: { value: 'newpass123' } 
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
      target: { value: 'newpass123' } 
    })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('currentpass', 'newpass123')
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument()
    })
    
    // Check that form is cleared after success
    expect(screen.getByLabelText(/current password/i)).toHaveValue('')
    expect(screen.getByLabelText(/new password/i)).toHaveValue('')
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('')
  })

  it('handles password change errors', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Current password is incorrect'))
    
    render(<ChangePasswordForm />)
    
    fireEvent.change(screen.getByLabelText(/current password/i), { 
      target: { value: 'wrongpass' } 
    })
    fireEvent.change(screen.getByLabelText(/new password/i), { 
      target: { value: 'newpass123' } 
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { 
      target: { value: 'newpass123' } 
    })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(<ChangePasswordForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const toggleButton = screen.getAllByRole('button')[0] // First toggle button
    
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
    
    fireEvent.click(toggleButton)
    expect(currentPasswordInput).toHaveAttribute('type', 'text')
    
    fireEvent.click(toggleButton)
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
  })
})