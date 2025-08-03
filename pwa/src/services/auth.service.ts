import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { env } from '@/config/env';
import type { AppUser, LoginRequest, RegisterRequest, UserServiceResponse } from '@/types/auth';

/**
 * Authentication service that integrates Firebase Auth with User Service
 */
export class AuthService {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AppUser> {
    try {
      console.log('🔐 Attempting login with:', email);
      
      // Call user service directly - it handles Firebase auth internally  
      const userProfile = await this.loginWithUserService({ email, password });
      
      // User service returns regular Firebase ID token, just use email/password to sign in
      await signInWithEmailAndPassword(auth, email, password);
      
      return userProfile;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Login failed';
      throw new Error(message);
    }
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<AppUser> {
    try {
      console.log('📝 Registering user on server:', email);
      
      // Call user service to create both Firebase user and Supabase record
      const userProfile = await this.registerWithUserService({ email, password, name });
      
      return userProfile;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Registration failed';
      throw new Error(message);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get Firebase ID token for current user
   */
  async getIdToken(): Promise<string | null> {
    const user = this.getCurrentFirebaseUser();
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Call user service for login
   */
  private async loginWithUserService(credentials: LoginRequest): Promise<AppUser> {
    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }
    
    const url = `${env.api.userServiceUrl}/login`;
    console.log('🔗 Calling login endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`User service login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle login response format (different from registration)
    if (data.data && data.data.user) {
      return {
        ...data.data.user,
        firebaseToken: data.data.firebaseToken,
        featureLevel: 'registered' as const
      };
    }
    
    throw new Error('Invalid login response format');
  }

  /**
   * Call user service for registration
   */
  private async registerWithUserService(userData: RegisterRequest): Promise<AppUser> {
    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }
    
    const url = `${env.api.userServiceUrl}/register`;
    console.log('🔗 Calling register endpoint:', url);
    console.log('📝 Registration data:', { ...userData, password: '[HIDDEN]' });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Registration failed - Status:', response.status);
      console.error('❌ Registration failed - Response:', errorText);
      throw new Error(`User service registration failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: UserServiceResponse = await response.json();
    
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Registration failed');
    }

    // If registration successful, sign in with the custom token
    if (data.customToken) {
      await this.signInWithCustomToken(data.customToken);
    }

    return data.user;
  }

  /**
   * Sign in with custom token (used after registration)
   */
  private async signInWithCustomToken(customToken: string): Promise<void> {
    try {
      const { signInWithCustomToken } = await import('firebase/auth');
      await signInWithCustomToken(auth, customToken);
      console.log('✅ Signed in with custom token');
    } catch (error) {
      console.error('❌ Failed to sign in with custom token:', error);
    }
  }

  /**
   * Get user profile from user service
   */
  async getUserProfile(): Promise<AppUser | null> {
    const idToken = await this.getIdToken();
    if (!idToken) return null;

    if (!env.api.userServiceUrl) {
      console.warn('User service not configured - user profile unavailable');
      return null;
    }

    try {
      const response = await fetch(`${env.api.userServiceUrl}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          await this.logout();
          return null;
        }
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle user profile response format
      if (data.data && data.data.dbUser) {
        return {
          id: data.data.dbUser.id,
          name: data.data.dbUser.name,
          email: data.data.dbUser.email,
          uid: data.data.user.uid,
          featureLevel: 'registered' as const
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile (name and/or email)
   */
  async updateProfile(name?: string, email?: string): Promise<AppUser> {
    const idToken = await this.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }

    if (!name && !email) {
      throw new Error('At least one field (name or email) is required');
    }

    try {
      const response = await fetch(`${env.api.userServiceUrl}/user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error('Profile update failed');
      }

      return data.user;
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Profile update failed';
      throw new Error(message);
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const idToken = await this.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }

    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    try {
      const response = await fetch(`${env.api.userServiceUrl}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to change password: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Password change failed');
      }
    } catch (error: unknown) {
      console.error('Password change error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Password change failed';
      throw new Error(message);
    }
  }

  /**
   * Get user login history
   */
  async getLoginHistory(limit: number = 20, offset: number = 0): Promise<{
    history: Array<{
      id: string;
      login_timestamp: string;
      ip_address: string;
      user_agent: string;
      login_method: string;
      success: boolean;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const idToken = await this.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }

    try {
      const url = `${env.api.userServiceUrl}/login-history?limit=${limit}&offset=${offset}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get login history: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to retrieve login history');
      }

      return {
        history: data.history || [],
        total: data.total || 0,
        limit: data.limit || limit,
        offset: data.offset || offset,
      };
    } catch (error: unknown) {
      console.error('Login history error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to retrieve login history';
      throw new Error(message);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    const idToken = await this.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    if (!env.api.userServiceUrl) {
      throw new Error('User service is not configured. Please check your environment variables.');
    }

    try {
      const response = await fetch(`${env.api.userServiceUrl}/user`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete account: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // After successful deletion, logout the user
      await this.logout();
    } catch (error: unknown) {
      console.error('Account deletion error:', error);
      const message = error && typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Account deletion failed';
      throw new Error(message);
    }
  }

  /**
   * Convert Firebase auth error codes to user-friendly messages
   */
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed. Please try again';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();