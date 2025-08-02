"use client"

import { useEffect, useState } from 'react';
import { env, validateEnvConfig } from '@/config/env';
import { getFirebaseStatus } from '@/lib/firebase-status';

export function FirebaseDebug() {
  const [status, setStatus] = useState<ReturnType<typeof getFirebaseStatus> | null>(null);
  const [envValidation, setEnvValidation] = useState<ReturnType<typeof validateEnvConfig> | null>(null);
  const [userServiceStatus, setUserServiceStatus] = useState<string>('Testing...');

  useEffect(() => {
    try {
      const firebaseStatus = getFirebaseStatus();
      const validation = validateEnvConfig();
      
      setStatus(firebaseStatus);
      setEnvValidation(validation);
      
      console.log('🔥 Firebase Debug Status:', firebaseStatus);
      console.log('🌍 Environment Validation:', validation);
      
      // Test user service connectivity
      testUserService();
    } catch (error) {
      console.error('Firebase debug error:', error);
    }
  }, []);

  const testUserService = async () => {
    try {
      if (!env.api.userServiceUrl) {
        setUserServiceStatus('❌ User service URL not configured');
        return;
      }
      
      const response = await fetch(env.api.userServiceUrl, {
        method: 'OPTIONS', // Test CORS
      });
      
      if (response.ok) {
        setUserServiceStatus('✅ User service is reachable');
      } else {
        setUserServiceStatus(`❌ User service error: ${response.status}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setUserServiceStatus(`❌ User service unreachable: ${message}`);
    }
  };

  if (!status || !envValidation) {
    return <div className="p-4 bg-gray-100 rounded">Loading Firebase status...</div>;
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded space-y-4 text-sm">
      <h3 className="font-bold text-yellow-400">🔥 Firebase Debug Status</h3>
      
      <div>
        <h4 className="font-semibold text-blue-300">Environment Validation:</h4>
        <div className={`p-2 rounded text-black ${envValidation.isValid ? 'bg-green-200' : 'bg-red-200'}`}>
          {envValidation.isValid ? '✅ Valid' : '❌ Invalid'}
          {envValidation.errors.length > 0 && (
            <div className="mt-1">
              <strong>Errors:</strong>
              <ul className="list-disc ml-4">
                {envValidation.errors.map((error: string, i: number) => (
                  <li key={i} className="text-red-800">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-blue-300">Firebase Configuration:</h4>
        <div className="p-2 bg-gray-700 rounded border border-gray-600">
          <div className="text-gray-200">Project ID: <code className="text-yellow-300">{env.firebase.projectId || 'NOT SET'}</code></div>
          <div className="text-gray-200">Auth Domain: <code className="text-yellow-300">{env.firebase.authDomain || 'NOT SET'}</code></div>
          <div className="text-gray-200">API Key: <code className="text-yellow-300">{env.firebase.apiKey ? '✅ SET' : '❌ NOT SET'}</code></div>
          <div className="text-gray-200">Messaging Sender ID: <code className="text-yellow-300">{env.firebase.messagingSenderId || 'NOT SET'}</code></div>
          <div className="text-gray-200">App ID: <code className="text-yellow-300">{env.firebase.appId || 'NOT SET'}</code></div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-blue-300">Firebase App Status:</h4>
        <div className="p-2 bg-gray-700 rounded border border-gray-600">
          <div className="text-gray-200">App Name: <code className="text-yellow-300">{status.app.name}</code></div>
          <div className="text-gray-200">Current User: <code className="text-yellow-300">{status.auth.currentUser}</code></div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-blue-300">User Service Status:</h4>
        <div className="p-2 bg-gray-700 rounded border border-gray-600">
          <div className="text-gray-200">URL: <code className="text-yellow-300 break-all">{env.api.userServiceUrl}</code></div>
          <div className="text-gray-200">Status: <code className="text-yellow-300">{userServiceStatus}</code></div>
        </div>
      </div>
    </div>
  );
}