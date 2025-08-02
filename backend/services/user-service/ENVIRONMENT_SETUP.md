# Firebase Functions Environment Setup

This guide explains how to configure environment variables for Firebase Functions v2.

## Required Environment Variables

You need to set these environment variables for your Firebase Functions:

### 1. Supabase Configuration
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (with admin privileges)

### 2. Firebase Configuration  
- `FIREBASE_API_KEY` - Your Firebase project API key

## How to Get These Values

### Supabase Values:
1. Go to your Supabase project dashboard
2. Go to Settings → API
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### Firebase API Key:
1. Go to Firebase Console → Project Settings
2. In the "Your apps" section, find your web app
3. Copy the `apiKey` value

## Setting Environment Variables

### Method 1: Using Firebase CLI (Recommended for Production)

```bash
# Set Supabase variables
firebase functions:config:set supabase.url="https://your-project.supabase.co"
firebase functions:config:set supabase.service_role_key="your-service-role-key"

# Set Firebase API key
firebase functions:config:set app.api_key="your-firebase-api-key"

# Deploy the config
firebase deploy --only functions
```

### Method 2: Using .env file (Development/Local)

1. Create `.env` file in `functions/` directory:
```bash
cd backend/services/user-service/functions/
cp .env.example .env
```

2. Edit `.env` with your actual values:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FIREBASE_API_KEY=your-firebase-api-key
```

### Method 3: Using Firebase Console

1. Go to Firebase Console → Functions
2. Go to "Environment variables" tab
3. Add the variables manually

## Verification

After setting the variables, test your functions:

```bash
# Test locally
npm run serve

# Test deployed functions
curl -X POST https://your-function-url/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass","name":"Test User"}'
```

## Security Notes

- ✅ Never commit `.env` files to version control
- ✅ Use service role keys only on the server side  
- ✅ Keep environment variables secure
- ✅ Use different keys for development and production