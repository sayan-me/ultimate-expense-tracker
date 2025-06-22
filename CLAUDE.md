# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Current State**: Full-stack PWA with working frontend and deployed backend user service

**Working Components**:
✅ **PWA Frontend** - Complete Next.js 15 PWA with offline capabilities
✅ **User Service Backend** - Deployed Firebase Functions with Supabase integration
⚠️ **Other Backend Services** - Placeholder microservices (not yet implemented)

**Active Development Focus**: PWA frontend and User Service integration

## Development Commands

### PWA Development (Primary Focus)
**Package Manager**: Use `pnpm` (required, not `npm` or `yarn`)

**Core Development**:
- `pnpm dev` - Start PWA development server (localhost:3000)
- `pnpm build` - Create PWA production build
- `pnpm start` - Start PWA production server
- `pnpm lint` - Run ESLint for PWA

**Testing**:
- `pnpm test` - Run all PWA tests with Vitest
- `pnpm test:watch` - Run PWA tests in watch mode
- `pnpm test:coverage` - Run PWA tests with coverage report
- `pnpm test:stores` - Run only Zustand store tests (critical for state management)
- `pnpm test:stores:watch` - Watch mode for store tests

### User Service Backend (Secondary Focus)
**Location**: `backend/services/user-service/functions/`
**Runtime**: Node.js 20 (required for Firebase CLI compatibility)

**Development Commands**:
- `cd backend/services/user-service/functions/`
- `npm run serve` - Start local Firebase Functions emulator
- `npm run build` - Build TypeScript functions
- `npm run deploy` - Deploy to Firebase (requires proper Node.js 20 setup)

**Deployment Requirements**:
- Node.js 20 (use `nvm use 20`)
- Firebase CLI v14+
- Environment variables: `export FUNCTIONS_DISCOVERY_TIMEOUT=60`
- Current deployment: `https://us-central1-uet-stg.cloudfunctions.net/auth`

## Architecture Overview

**Project Type**: Full-stack Progressive Web App (PWA) expense tracker with microservices backend

**Primary Tech Stack**:
- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS
- **State Management**: Zustand with persistence middleware
- **Database**: IndexedDB (Dexie.js) for offline-first storage
- **Backend**: Firebase Functions + Supabase (PostgreSQL)
- **Authentication**: Firebase Auth with custom user levels

**Secondary Tech Stack** (Future/Placeholder):
- **Microservices**: Go services (analytics, budget, expense, group, notification)
- **ML Services**: Python FastAPI (prediction, receipt-scanner)
- **Infrastructure**: Kubernetes + Terraform

## Key Architecture Patterns (PWA Focus)

**1. PWA Feature Gating System**
- User levels: `basic`, `registered`, `premium` (defined in `src/stores/auth.ts:44-46`)
- Features controlled via `src/config/features.ts`
- Access checked using `useHasAccessLevel(requiredLevel)` hook
- Critical for monetization and user experience

**2. PWA State Management**
- Zustand stores in `src/stores/` for different domains (auth, UI, preferences)
- All stores use persistence middleware and follow consistent patterns
- Store selectors and hooks provide clean access patterns
- **Testing requirement**: All stores must have test coverage in `src/stores/__tests__/`

**3. PWA Database Layer**
- IndexedDB via Dexie.js (`src/lib/db.ts`) for offline storage
- Schema: `transactions` and `accounts` tables with relational structure
- Offline-first design with eventual cloud sync capability
- Use `useLiveQuery` for reactive database queries

**4. PWA Component Structure**
- Feature-based organization in `src/components/`
- Shadcn/ui components in `src/components/ui/`
- Layout components handle navigation and authentication
- Responsive design with mobile-first approach

**5. User Service Backend Integration**
- Firebase Functions deployed at: `https://us-central1-uet-stg.cloudfunctions.net/auth`
- Endpoints: `/login`, `/register`, `/user` (GET/DELETE)
- Supabase integration for user data persistence
- CORS enabled for PWA integration

**6. PWA Features**
- Service worker for offline functionality
- Offline page at `src/app/offline/`
- Installable with proper manifest configuration
- Background sync capabilities (planned)

## Development Guidelines

### PWA Development
**State Updates**: Always use Zustand store actions, never mutate state directly

**Feature Development**: Check feature gates before implementing user-level restricted features

**Database Operations**: Use Dexie hooks (`useLiveQuery`) for reactive queries

**Component Patterns**: Follow existing patterns in `src/components/` for new components

**Testing**: Store tests are critical - all Zustand stores must have test coverage

### User Service Backend Development
**Environment Setup**: Always use Node.js 20 (`nvm use 20`) before working with Firebase Functions

**Configuration**: Set `export FUNCTIONS_DISCOVERY_TIMEOUT=60` before deployment

**Code Patterns**: Use lazy initialization for external services (Supabase) to avoid deployment timeouts

**Debugging**: Use `firebase deploy --only functions --debug` for troubleshooting

## Deployment Status

### Production Deployments
✅ **User Service**: `https://us-central1-uet-stg.cloudfunctions.net/auth` (Firebase Functions)
⏳ **PWA**: Ready for deployment to Vercel/Netlify
❌ **Other Services**: Not yet implemented

### Firebase Functions Lessons Learned
- **Node.js Version Compatibility**: Use Node.js 20 for Firebase CLI v14+
- **Discovery Timeout**: Set `FUNCTIONS_DISCOVERY_TIMEOUT=60` for complex functions
- **Lazy Initialization**: Initialize external services (Supabase) inside functions, not at module level
- **Fresh Projects**: Use new Firebase projects to avoid legacy configuration issues

See `FIREBASE_FUNCTIONS_DEPLOYMENT_INVESTIGATION.md` for detailed troubleshooting guide.

## Working with this Repository

**Primary Development**: Focus on PWA (`src/` directory) and User Service integration
**Secondary Development**: User Service backend (`backend/services/user-service/`)
**Future Development**: Other backend services are placeholders for future implementation

**Key Files to Monitor**:
- `src/stores/auth.ts` - Authentication state and user levels
- `src/config/features.ts` - Feature gating configuration
- `backend/services/user-service/functions/src/index.ts` - User service endpoints
- `FIREBASE_FUNCTIONS_DEPLOYMENT_INVESTIGATION.md` - Deployment troubleshooting