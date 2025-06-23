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
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Step 3: Call user service to get/sync user profile
      const userProfile = await this.loginWithUserService({ email, password }, idToken);
      
      return userProfile;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : '';
      throw new Error(this.getAuthErrorMessage(errorCode));
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
  private async loginWithUserService(credentials: LoginRequest, idToken: string): Promise<AppUser> {
    const url = `${env.api.userServiceUrl}/login`;
    console.log('🔗 Calling login endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`User service login failed: ${response.statusText}`);
    }

    const data: UserServiceResponse = await response.json();
    
    if (!data.success || !data.user) {
      throw new Error(data.message || 'Login failed');
    }

    return data.user;
  }

  /**
   * Call user service for registration
   */
  private async registerWithUserService(userData: RegisterRequest): Promise<AppUser> {
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

      const data: UserServiceResponse = await response.json();
      
      if (!data.success || !data.user) {
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
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