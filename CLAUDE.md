# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: Use `pnpm` (required, not `npm` or `yarn`)

**Core Development**:
- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

**Testing**:
- `pnpm test` - Run all tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:stores` - Run only Zustand store tests
- `pnpm test:stores:watch` - Watch mode for store tests

## Architecture Overview

**Project Type**: Progressive Web App (PWA) expense tracker with offline-first architecture

**Tech Stack**:
- Next.js 15.1.2 (App Router) + TypeScript
- TailwindCSS + Shadcn/ui components
- Zustand for state management with persistence
- IndexedDB (Dexie.js) for client-side storage
- Firebase Functions backend with Supabase database

**Key Architecture Patterns**:

**1. Feature Gating System**
- User levels: `basic`, `registered`, `premium` (defined in `/src/stores/auth.ts:44-46`)
- Features controlled via `/src/config/features.ts`
- Access checked using `useHasAccessLevel(requiredLevel)` hook

**2. State Management**
- Zustand stores in `/src/stores/` for different domains (auth, UI, preferences)
- All stores use persistence middleware and follow consistent patterns
- Store selectors and hooks provide clean access patterns

**3. Database Layer**
- IndexedDB via Dexie.js (`/src/lib/db.ts`) for offline storage
- Schema: `transactions` and `accounts` tables with relational structure
- Offline-first design with eventual cloud sync capability

**4. Component Structure**
- Feature-based organization in `/src/components/`
- Shadcn/ui components in `/src/components/ui/`
- Layout components handle navigation and authentication

**5. Authentication Flow**
- Firebase Auth integration with custom user levels
- Authentication guards for routes and features
- Persistent auth state across sessions

**6. PWA Features**
- Service worker with `next-pwa` 
- Offline page at `/src/app/offline/`
- Installable with proper manifest configuration

## Development Guidelines

**State Updates**: Always use Zustand store actions, never mutate state directly

**Feature Development**: Check feature gates before implementing user-level restricted features

**Database Operations**: Use Dexie hooks (`useLiveQuery`) for reactive queries

**Component Patterns**: Follow existing patterns in `/src/components/` for new components

**Testing**: Store tests are critical - all Zustand stores must have test coverage in `/src/stores/__tests__/`