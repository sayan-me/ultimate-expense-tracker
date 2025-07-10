import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AccountProfileForm } from '../account-profile-form'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/services/auth.service'

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock the auth service
jest.mock('@/services/auth.service', () => ({
  authService: {
    updateProfile: jest.fn(),
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUpdateProfile = authService.updateProfile as jest.MockedFunction<typeof authService.updateProfile>

describe('AccountProfileForm', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    uid: 'firebase-uid',
    featureLevel: 'registered' as const,
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      firebaseUser: null,
      loading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      clearError: jest.fn(),
    })
    jest.clearAllMocks()
  })

  it('renders form with user data', () => {
    render(<AccountProfileForm />)
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled()
  })

  it('enables update button when form data changes', () => {
    render(<AccountProfileForm />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    
    expect(screen.getByRole('button', { name: /update profile/i })).not.toBeDisabled()
  })

  it('shows error when no changes are detected', async () => {
    render(<AccountProfileForm />)
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('No changes detected')).toBeInTheDocument()
    })
  })

  it('successfully updates profile', async () => {
    const updatedUser = { ...mockUser, name: 'Jane Doe' }
    mockUpdateProfile.mockResolvedValueOnce(updatedUser)
    
    render(<AccountProfileForm />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('Jane Doe', undefined)
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument()
    })
  })

  it('handles update errors', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'))
    
    render(<AccountProfileForm />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('updates both name and email', async () => {
    const updatedUser = { ...mockUser, name: 'Jane Doe', email: 'jane.doe@example.com' }
    mockUpdateProfile.mockResolvedValueOnce(updatedUser)
    
    render(<AccountProfileForm />)
    
    const nameInput = screen.getByDisplayValue('John Doe')
    const emailInput = screen.getByDisplayValue('john.doe@example.com')
    
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.change(emailInput, { target: { value: 'jane.doe@example.com' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith('Jane Doe', 'jane.doe@example.com')
    })
  })
})