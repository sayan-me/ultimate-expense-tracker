# User Account Management Implementation Plan

## Overview
Add a comprehensive user account management page to the PWA that allows users to:
- Update username, email, and password
- Delete their account
- View login history

## Current Backend Analysis

### ✅ Existing APIs (User Service)
- **Login**: `POST /login` - User authentication
- **Register**: `POST /register` - User registration  
- **User Profile**: `GET /user` - Get user details
- **Delete User**: `DELETE /user` - Delete user account
- **Login History**: Already recorded in `login_history` table

### ❌ Missing APIs (Need Implementation)
1. **Update User Profile**: `PUT /user` - Update name/email
2. **Change Password**: `POST /change-password` - Update password
3. **Get Login History**: `GET /login-history` - Retrieve user's login history

## Backend Implementation Plan

### 1. Add Missing Endpoints to User Service

#### A. Update User Profile (`PUT /user`)
- Validate Bearer token
- **Update Firebase user record** (email, displayName)
- **Update Supabase users table** (name, email) - **CRITICAL: Keep both systems in sync**
- Handle email uniqueness validation in both systems
- Use transaction-like pattern: update Firebase first, then Supabase
- On failure, rollback Firebase changes if possible
- Return updated user profile

#### B. Change Password (`POST /change-password`)
- Validate Bearer token
- Require current password verification via Firebase Auth
- **Update password in Firebase only** (Supabase doesn't store passwords)
- Use Firebase Admin SDK to update password
- Return success/failure response

#### C. Get Login History (`GET /login-history`)
- Validate Bearer token
- Query `login_history` table by user ID
- Return paginated login history with IP, user agent, timestamp
- Include success/failure status

### 2. Data Consistency Strategy
- **Firebase**: Source of truth for authentication (email, password, displayName)
- **Supabase**: Source of truth for application data (user profiles, login history)
- **Sync Pattern**: Always update Firebase first, then Supabase
- **Error Handling**: Implement rollback logic for failed Supabase updates

### 3. Database Schema Updates
- ✅ `login_history` table already exists with proper structure
- ✅ Users table exists with name, email fields
- No schema changes required

## Frontend Implementation Plan

### 1. Create Account Management Page (`/settings/account`)

#### A. Page Structure
- **Profile Section**: Update name, email
- **Security Section**: Change password, view login history
- **Danger Zone**: Delete account

#### B. Components to Create
- `AccountProfileForm` - Update name/email
- `ChangePasswordForm` - Password change functionality
- `LoginHistoryList` - Display login history
- `DeleteAccountDialog` - Account deletion confirmation

### 2. Integration Points

#### A. Auth Service Updates
- Add methods for profile updates, password changes
- Add login history fetching
- Handle new API endpoints
- Update user context after successful profile changes

#### B. UI/UX Considerations
- Form validation for email format, password strength
- Loading states during API calls
- Success/error notifications
- Confirmation dialogs for destructive actions

### 3. Security Considerations
- Current password required for sensitive changes
- Email verification for email changes (future enhancement)
- Rate limiting for password changes
- Clear session on account deletion
- Maintain data consistency between Firebase and Supabase

## Implementation Steps

1. **Backend**: Add missing API endpoints to user service with dual-system updates
2. **Frontend**: Create account management page structure
3. **Frontend**: Implement profile update forms
4. **Frontend**: Add login history display
5. **Frontend**: Implement account deletion flow
6. **Testing**: Add comprehensive test coverage for data consistency
7. **Integration**: Update navigation to include account settings

## File Structure

### Backend Changes
```
backend/services/user-service/functions/src/
├── index.ts                 # Add new endpoints
```

### Frontend Changes
```
pwa/src/app/settings/account/
├── page.tsx                 # Main account management page
├── components/
│   ├── account-profile-form.tsx
│   ├── change-password-form.tsx
│   ├── login-history-list.tsx
│   └── delete-account-dialog.tsx

pwa/src/services/
├── auth.service.ts          # Add new methods
```

## API Specifications

### Update User Profile - `PUT /user`
```typescript
Request:
{
  name?: string;
  email?: string;
}

Response:
{
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    uid: string;
  };
}
```

### Change Password - `POST /change-password`
```typescript
Request:
{
  currentPassword: string;
  newPassword: string;
}

Response:
{
  success: boolean;
  message: string;
}
```

### Get Login History - `GET /login-history`
```typescript
Query Parameters:
?limit=20&offset=0

Response:
{
  success: boolean;
  history: Array<{
    id: string;
    login_timestamp: string;
    ip_address: string;
    user_agent: string;
    login_method: string;
    success: boolean;
  }>;
  total: number;
}
```

## Dependencies
- Existing auth service and context
- Shadcn/ui components (forms, dialogs, tables)
- Firebase Admin SDK (backend)
- Supabase client (backend)

## Testing Strategy
- Unit tests for new backend endpoints
- Integration tests for Firebase/Supabase sync
- Frontend component tests
- End-to-end tests for critical user flows

This plan builds on the existing architecture and follows established patterns in the codebase, ensuring data consistency between Firebase and Supabase systems.