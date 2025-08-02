import { authService } from '../auth.service'
import { env } from '@/config/env'

// Mock fetch
global.fetch = jest.fn()

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(),
    },
  },
}))

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('AuthService User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock getIdToken to return a valid token
    const mockUser = {
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
    jest.spyOn(authService, 'getCurrentFirebaseUser').mockReturnValue(mockUser as never)
  })

  describe('updateProfile', () => {
    it('successfully updates user profile', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '1',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          uid: 'firebase-uid',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as Response)

      const result = await authService.updateProfile('Jane Doe', 'jane.doe@example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        `${env.api.userServiceUrl}/user`,
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Jane Doe', email: 'jane.doe@example.com' }),
        }
      )

      expect(result).toEqual(mockResponse.user)
    })

    it('throws error when no fields provided', async () => {
      await expect(authService.updateProfile()).rejects.toThrow(
        'At least one field (name or email) is required'
      )
    })

    it('handles update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Validation error'),
      } as Response)

      await expect(authService.updateProfile('Jane Doe')).rejects.toThrow(
        'Failed to update profile: 400 Bad Request - Validation error'
      )
    })
  })

  describe('changePassword', () => {
    it('successfully changes password', async () => {
      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as Response)

      await authService.changePassword('currentpass', 'newpass123')

      expect(mockFetch).toHaveBeenCalledWith(
        `${env.api.userServiceUrl}/change-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            currentPassword: 'currentpass', 
            newPassword: 'newpass123' 
          }),
        }
      )
    })

    it('validates password requirements', async () => {
      await expect(authService.changePassword('', 'newpass')).rejects.toThrow(
        'Current password and new password are required'
      )

      await expect(authService.changePassword('current', '123')).rejects.toThrow(
        'New password must be at least 6 characters long'
      )
    })

    it('handles password change errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: jest.fn().mockResolvedValue('Current password is incorrect'),
      } as Response)

      await expect(authService.changePassword('wrongpass', 'newpass123')).rejects.toThrow(
        'Failed to change password: 400 Bad Request - Current password is incorrect'
      )
    })
  })

  describe('getLoginHistory', () => {
    it('successfully retrieves login history', async () => {
      const mockResponse = {
        success: true,
        history: [
          {
            id: '1',
            login_timestamp: '2023-01-01T00:00:00Z',
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0...',
            login_method: 'password',
            success: true,
          }
        ],
        total: 1,
        limit: 20,
        offset: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as Response)

      const result = await authService.getLoginHistory(20, 0)

      expect(mockFetch).toHaveBeenCalledWith(
        `${env.api.userServiceUrl}/login-history?limit=20&offset=0`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(result).toEqual({
        history: mockResponse.history,
        total: 1,
        limit: 20,
        offset: 0,
      })
    })

    it('uses default pagination parameters', async () => {
      const mockResponse = {
        success: true,
        history: [],
        total: 0,
        limit: 20,
        offset: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as Response)

      await authService.getLoginHistory()

      expect(mockFetch).toHaveBeenCalledWith(
        `${env.api.userServiceUrl}/login-history?limit=20&offset=0`,
        expect.any(Object)
      )
    })
  })

  describe('deleteAccount', () => {
    it('successfully deletes account and logs out', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'User successfully deleted' }),
      } as Response)

      // Mock logout method
      const logoutSpy = jest.spyOn(authService, 'logout').mockResolvedValue()

      await authService.deleteAccount()

      expect(mockFetch).toHaveBeenCalledWith(
        `${env.api.userServiceUrl}/user`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        }
      )

      expect(logoutSpy).toHaveBeenCalled()
    })

    it('handles account deletion errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Deletion failed'),
      } as Response)

      await expect(authService.deleteAccount()).rejects.toThrow(
        'Failed to delete account: 500 Internal Server Error - Deletion failed'
      )
    })
  })
})