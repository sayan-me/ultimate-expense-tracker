import { User as FirebaseUser } from 'firebase/auth';

// User levels supported by the application
export type UserLevel = 'basic' | 'registered' | 'premium';

// Application user interface extending Firebase user
export interface AppUser {
  id: string;
  email: string;
  name: string;
  featureLevel: UserLevel;
  uid?: string; // Firebase UID
  firebaseToken?: string; // Firebase ID token
  createdAt?: string;
  updatedAt?: string;
}

// Authentication request interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// User service response interfaces
export interface UserServiceResponse {
  success: boolean;
  message: string;
  user?: AppUser;
  token?: string;
  customToken?: string; // For registration flow
}

// Authentication context interface
export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<AppUser>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}