"use client"

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, register, loading, error, clearError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isRegistering) {
        await register(formData.email, formData.password, formData.name);
      } else {
        await login(formData.email, formData.password);
      }
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
      console.log('Login/Register failed:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    clearError();
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isRegistering ? 'Create Account' : 'Sign In'}
        </CardTitle>
        <CardDescription>
          {isRegistering 
            ? 'Create a new account to get started'
            : 'Sign in to your account to continue'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}
          
          {isRegistering && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required={isRegistering}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading 
              ? (isRegistering ? 'Creating Account...' : 'Signing In...') 
              : (isRegistering ? 'Create Account' : 'Sign In')
            }
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={toggleMode}
            disabled={loading}
          >
            {isRegistering 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"
            }
          </button>
        </div>

      </CardContent>
    </Card>
  );
}