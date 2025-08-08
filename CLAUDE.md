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
**Node.js Version**: Node.js 18+ recommended for PWA development

**Core Development**:
- `cd pwa/ && pnpm dev` - Start PWA development server (localhost:3000)
- `cd pwa/ && pnpm dev:verbose` - Start dev server with debug logging enabled
- `cd pwa/ && pnpm dev:progress` - Start dev server with progress tracking
- `cd pwa/ && pnpm dev:quick` - Quick development start using shell script
- `cd pwa/ && pnpm build` - Create PWA production build
- `cd pwa/ && pnpm start` - Start PWA production server
- `cd pwa/ && pnpm lint` - Run ESLint for PWA

**Testing**:
- `cd pwa/ && pnpm test` - Run all PWA tests with Vitest
- `cd pwa/ && pnpm test:watch` - Run PWA tests in watch mode
- `cd pwa/ && pnpm test:coverage` - Run PWA tests with coverage report
- `cd pwa/ && pnpm test:stores` - Run only Zustand store tests (critical for state management)
- `cd pwa/ && pnpm test:stores:watch` - Watch mode for store tests
- `cd pwa/ && vitest run src/path/to/specific.test.ts` - Run individual test file

### User Service Backend (Secondary Focus)
**Location**: `backend/services/user-service/functions/`
**Runtime**: Node.js 20 (required for Firebase CLI v14+ compatibility)
**Note**: Must use Node.js 20 specifically for Firebase Functions, different from PWA requirements

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
- User levels: `basic`, `registered`, `premium` (defined in `pwa/src/stores/auth.ts:44-46`)
- Features controlled via `pwa/src/config/features.ts`
- Access checked using `useHasAccessLevel(requiredLevel)` hook
- Critical for monetization and user experience

**2. PWA State Management**
- Zustand stores in `pwa/src/stores/` for different domains (auth, UI, preferences, offline-sync)
- All stores use persistence middleware and follow consistent patterns
- Store selectors and hooks provide clean access patterns
- **Testing requirement**: All stores must have test coverage in `pwa/src/stores/__tests__/`

**3. PWA Offline-First Architecture**
- **Database Layer**: IndexedDB via Dexie.js (`pwa/src/lib/db.ts`) for offline storage
- **Schema**: `transactions`, `accounts`, and `categories` tables with relational structure
- **Reactive Queries**: Use `useLiveQuery` hooks for reactive database queries
- **Migration Support**: Database versioning with upgrade scripts for schema changes
- **Sync Queue**: Offline operations queued in `offline-sync` store for eventual sync
- **Network-Aware**: Network status tracking and automatic sync when online

**4. PWA Authentication Architecture**
- **Dual Authentication**: Firebase Auth + User Service backend integration
- **State Synchronization**: Auth context and Zustand store kept in sync via `useAuthSync` hook
- **Feature Level Mapping**: User service response maps to feature levels (`basic`, `registered`, `premium`)
- **Token Management**: Firebase ID tokens used for backend authentication
- **Persistent State**: Authentication state persisted across sessions

**5. PWA Component Structure**
- Feature-based organization in `pwa/src/components/`
- Shadcn/ui components in `pwa/src/components/ui/`
- Layout components handle navigation and authentication
- Responsive design with mobile-first approach
- Comprehensive test coverage for UI components

**6. User Service Backend Integration**
- Firebase Functions deployed at: `https://us-central1-uet-stg.cloudfunctions.net/auth`
- Endpoints: `/login`, `/register`, `/user` (GET/PUT/DELETE), `/change-password`, `/login-history`
- Supabase integration for user data persistence
- CORS enabled for PWA integration
- Custom token generation for seamless Firebase Auth integration

**7. PWA Features**
- Service worker for offline functionality
- Offline page at `pwa/src/app/offline/`
- Installable with proper manifest configuration
- Background sync capabilities via operation queue
- Network status monitoring and automatic sync retry

**8. Expense Logging System (Current Development)**
- **Current Branch**: `feature/basic-expense-logging` with prototype implementation
- **Database Operations**: CRUD operations via `useTransactions`, `useAccounts`, `useCategories` hooks
- **Data Validation**: Zod schemas for expense validation (`pwa/src/lib/validations/expense.ts`)
- **Category Management**: Default and custom categories with type restrictions
- **Account Management**: Multiple account types with balance tracking

## Development Guidelines

### PWA Development (Follow .cursorrules patterns)
**Code Style & Structure**:
- Use early returns for readability
- Use Tailwind classes exclusively (no CSS or style tags)
- Use descriptive variable/function names with "handle" prefix for events (e.g., `handleClick`)
- Use `const` instead of `function` declarations (e.g., `const toggle = () =>`)
- Use lowercase-with-dashes for directory names (e.g., `components/auth-wizard`)
- Structure files: exported components, subcomponents, helpers, static content, types

**Accessibility Requirements**:
- Implement accessibility on all interactive elements
- Add `tabindex="0"`, `aria-label`, `on:click`, `on:keydown` to interactive elements
- Use class: syntax instead of tertiary operators in class tags when possible
- Define types for functions and components where possible

**React/Next.js Patterns**:
- Minimize `'use client'`, `useEffect`, `setState` - prefer RSC and SSR
- Use dynamic imports for code splitting and optimization
- Mobile-first responsive design approach
- Optimize images: use WebP format, include size data, implement lazy loading

**State Updates**: Always use Zustand store actions, never mutate state directly

**Feature Development**: Check feature gates before implementing user-level restricted features

**Database Operations**: 
- Use Dexie hooks (`useLiveQuery`) for reactive queries
- Use custom hooks from `pwa/src/hooks/use-db.ts` for CRUD operations
- Always handle database migrations when schema changes are needed
- Queue offline operations in sync store for eventual cloud synchronization

**Component Patterns**: Follow existing patterns in `pwa/src/components/` for new components

**Authentication Integration**:
- Use `useAuthSync` hook to keep context and store in sync
- Use `useAuthState` for components that need both auth sources
- Always check user levels before accessing premium features

**Testing Configuration & Requirements**: 
- **Framework**: Vitest with React plugin and jsdom environment
- **Setup**: Test setup file at `src/tests/setup.ts` with global test utilities
- **Store Tests**: Critical - all Zustand stores must have comprehensive test coverage
- **Component Tests**: Use Vitest with jsdom environment and React Testing Library
- **Database Tests**: Mock IndexedDB with `fake-indexeddb` for offline storage testing
- **Network Tests**: Test offline functionality with network status mocking
- **Path Alias**: `@` alias resolves to `./src` for clean imports in tests
- **Coverage**: Use `pnpm test:coverage` for detailed coverage reports

**Offline-First Development**:
- Always implement offline-first patterns for data operations
- Queue operations when offline using `useOfflineSyncStore`
- Provide user feedback for sync status and network connectivity
- Handle sync conflicts gracefully

### User Service Backend Development
**Environment Setup**: Always use Node.js 20 (`nvm use 20`) before working with Firebase Functions

**Configuration**: Set `export FUNCTIONS_DISCOVERY_TIMEOUT=60` before deployment

**Code Patterns**: Use lazy initialization for external services (Supabase) to avoid deployment timeouts

**Debugging**: Use `firebase deploy --only functions --debug` for troubleshooting

### Go Services Development (Future/Placeholder)
**Structure**: All Go services follow consistent patterns in `backend/services/`
- Standard Go project layout: `cmd/server/`, `internal/`, `tests/integration/`
- Each service has: config, handler, model, repository, service layers

**Testing Commands** (when services are implemented):
- `make test` - Run unit tests with verbose output (`go test ./... -v`)
- `make test-coverage` - Generate coverage report and open in browser (`go test ./... -coverprofile=coverage.out`)
- `make test-integration` - Run integration tests with tags (`go test ./tests/integration/... -v -tags=integration`)
- `make lint` - Run golangci-lint for code quality

**Current Status**: Services are placeholder structures only

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

## Important Constraints

**Protected Files** (Never modify without explicit user request):
- `.cursorrules` - Development rules and patterns
- `docs/UET_Product_details.md` - Product specifications
- `docs/HomePage_UI_layout.md` - UI design specifications

**Package Manager Requirements**:
- **PWA**: Use `pnpm` exclusively (not `npm` or `yarn`)
- **User Service**: Use `npm` (Firebase Functions requirement)
- **Go Services**: Use `make` commands for build, test, and lint operations

**Development Documentation Requirements**:
- **Task Documentation**: Always create TASK.md when starting new tasks or features
- **Progress Tracking**: Document objectives, approach, progress, blockers, and completion criteria
- **Code Documentation**: Use JSDoc comments for functions and components to improve IDE intellisense
- **Error Handling**: Implement proper error handling and user input validation
- **Security**: Follow secure coding practices and never commit sensitive information

## Working with this Repository

**Primary Development**: Focus on PWA (`pwa/` directory) and User Service integration
**Secondary Development**: User Service backend (`backend/services/user-service/`)
**Future Development**: Other backend services are placeholders for future implementation

**Key Files to Monitor**:
- `pwa/src/stores/auth.ts` - Authentication state and user levels
- `pwa/src/stores/offline-sync.ts` - Offline operation queue and network status
- `pwa/src/config/features.ts` - Feature gating configuration
- `pwa/src/lib/db.ts` - IndexedDB schema and database initialization
- `pwa/src/hooks/use-db.ts` - Database operation hooks with reactive queries
- `pwa/src/services/auth.service.ts` - Firebase Auth and User Service integration
- `pwa/src/hooks/use-auth-sync.ts` - Authentication state synchronization
- `backend/services/user-service/functions/src/index.ts` - User service endpoints
- `docs/FIREBASE_FUNCTIONS_DEPLOYMENT_INVESTIGATION.md` - Deployment troubleshooting

**Development Context**:
- **Current Work**: Basic expense logging prototype with known bugs (see recent commits)
- **Active Branch**: `feature/basic-expense-logging` - contains foundational expense tracking functionality
- **Critical Testing**: All Zustand stores must have comprehensive test coverage
- **Database Evolution**: Schema versioning in place for future feature additions