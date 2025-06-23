# Environment Setup Guide

This guide explains how to configure environment variables for the PWA application.

## Required Environment Variables

### Firebase Configuration
These are required for Firebase authentication and functions integration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=uet-stg.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=uet-stg
```

### User Service Configuration
This is required for backend integration:

```bash
NEXT_PUBLIC_USER_SERVICE_URL=https://us-central1-uet-stg.cloudfunctions.net/auth
```

## Optional Environment Variables

### Additional Firebase Settings
```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=uet-stg.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### Development Configuration
```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false  # Set to true for local Firebase emulators
NEXT_PUBLIC_DEBUG_MODE=true              # Enable debug logging
```

### Application Configuration
```bash
NEXT_PUBLIC_APP_NAME=Ultimate Expense Tracker
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Setup Instructions

### Local Development

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your actual values:**
   - Get Firebase configuration from your Firebase project console
   - Use the deployed user service URL
   - Keep development flags as needed

3. **Verify configuration:**
   ```bash
   pnpm dev
   ```
   Check the browser console for environment validation messages.

### Production Deployment (Vercel)

1. **Add environment variables in Vercel dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all required variables

2. **Environment-specific values:**
   - **Development:** Can use Firebase emulators if needed
   - **Production:** Must use production Firebase project and HTTPS URLs

## Firebase Project Setup

### Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`uet-stg`)
3. Go to Project Settings (gear icon)
4. Scroll to "Your apps" section
5. Copy the configuration values

### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

## Security Notes

- ✅ Environment files are gitignored for security
- ✅ Only `.env.local.example` is committed (no secrets)
- ✅ All sensitive values use `NEXT_PUBLIC_` prefix for client-side access
- ✅ Configuration validation prevents missing variables

## Troubleshooting

### Missing Environment Variables
If you see configuration errors:
1. Check that all required variables are set
2. Restart the development server after adding variables
3. Check browser console for specific missing variables

### Firebase Connection Issues
1. Verify Firebase project ID matches your actual project
2. Check that authentication is enabled in Firebase Console
3. Ensure functions are deployed and accessible

### User Service Connection Issues
1. Verify the user service URL is correct and accessible
2. Check CORS configuration if seeing cross-origin errors
3. Test the user service endpoints directly

## Environment Validation

The application automatically validates environment configuration on startup:
- ✅ Required variables are checked
- ⚠️ Warnings for potential issues
- 🔍 Debug logging in development mode

Check the browser console for validation results.