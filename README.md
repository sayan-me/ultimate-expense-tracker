# Ultimate Expense Tracker (UET)

A local-first Progressive Web App for tracking personal expenses. It works fully offline with no account; sign-in (Firebase) is optional and only needed for the cloud features that are still being built.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the current status review and the phased plan. That file is the source of truth for what is done and what comes next.

## What works today

- Log expenses and income into IndexedDB (Dexie) with categories, tags and a default Cash account
- Balance card and recent transactions
- Installable PWA with offline fallback page (service worker via Serwist)
- Optional sign-in: Firebase Auth + the user service (register, login, profile, change password, delete account, login history)

Not built yet (UI placeholders or mock data): budgets, groups and splitting, savings goals, receipts, imports. History, Monthly Spend and Notifications still render hardcoded mock data (`pwa/src/lib/data.ts`) until Phase 1.

## Repository layout

```
pwa/                          Next.js 15 App Router PWA (the app)
backend/services/user-service Firebase Functions (auth/user API) backed by Supabase
backend/db/schema.sql         Postgres schema (domain reference, 26 tables)
backend/db/supabase/          Supabase CLI config, migration and seed data
docs/                         Product spec, roadmap, deployment notes
```

## Getting started

Prerequisites: Node.js 20+ and [pnpm](https://pnpm.io).

```bash
cd pwa
pnpm install
pnpm dev          # http://localhost:3000
```

No environment variables are required. Without Firebase configuration the app runs in local-only mode and the sign-in page shows "Sign-in not configured".

### Enabling sign-in (optional)

Copy `pwa/.env.local.example` to `pwa/.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values and `NEXT_PUBLIC_USER_SERVICE_URL`.

### PWA commands

```bash
cd pwa
pnpm dev              # development server
pnpm build            # production build (also generates public/sw.js)
pnpm start            # serve the production build
pnpm lint             # ESLint
pnpm exec tsc --noEmit  # typecheck
pnpm test             # Vitest (watch mode); use `pnpm exec vitest run` for a single run
```

The service worker is only generated for production builds; it is disabled in `pnpm dev`.

### User service (Firebase Functions)

```bash
nvm use 20
cd backend/services/user-service/functions
npm ci
npm run build
npm run serve         # local emulator
```

Deployment notes live in `docs/FIREBASE_FUNCTIONS_DEPLOYMENT_INVESTIGATION.md` (Node 20, `FUNCTIONS_DISCOVERY_TIMEOUT=60`, lazy initialisation of external clients).

## Architecture notes

- State: React contexts (`auth-context`, `db-context`, `activities-context`) plus Dexie live queries. A small Zustand store (`pwa/src/stores/auth.ts`) mirrors auth state via `useAuthSync`.
- Data: IndexedDB through Dexie (`pwa/src/lib/db.ts`), offline-first.
- UI: Tailwind CSS and shadcn/ui; forms use react-hook-form and zod.

## Contributing

Work on a branch and open a PR. CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build for the PWA, and builds the user service.
