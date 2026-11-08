# UET Roadmap — Status Review & Incremental Plan

Last reviewed: 2026-11-08

## Context

- **History:**
  - Nov–Dec 2024: specs, DB schema, empty microservice/infra scaffold.
  - Dec 2024–Feb 2025: PWA shell (layout, overview, activities bar, feature gating, Zustand stores).
  - June–July 2025: Firebase auth + user service (Firebase Functions + Supabase), account management (profile, password change, delete account, login history).
  - Aug 2025 (Sayan): basic expense logging: add-expense modal, categories, tags, default Cash account.
  - Last activity 2025-08-12 (PR #25). Project dormant since.
- **Deployed backend still live:** `https://us-central1-uet-stg.cloudfunctions.net/auth` (returns 401 unauthenticated).

## Current State (origin/main @ 8e499e0)

**Works:** log expense/income into IndexedDB (Dexie) with categories, tags, default Cash account; balance card; recent transactions; Firebase login/register/profile/password/delete via user service.

**Placeholder only:** budgets, groups, splitting, savings goals, receipts, imports. Go/Python services and Terraform/Helm folders contain 0 lines of code.

### Health Check

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `pnpm test` | 164 of 238 tests fail (21 of 28 files) |
| `pnpm build` | Fails without Firebase env vars (`firebase.ts` throws when prerendering `/offline`) |

### Security Note

Commit `d5770b3` committed `functions/.runtimeconfig.json` containing a Supabase service_role key and a Google API key. Both keys were rotated when commit `0fa0269` removed the file, so no action is needed. The old values remain in git history but are invalid.

## What's Good (Keep)

- Local-first, no-signup design: works offline with no login for personal tracking; sign up only for sync/groups.
- Add-expense flow (`components/expense/*`): react-hook-form + zod, searchable category selector, tags input, responsive modal. Most polished code; tags tests pass.
- Dexie schema with versioned migrations (`lib/db.ts`).
- Product spec (`docs/UET_Product_details.md`) and 26-table Postgres schema (`backend/db/schema.sql`) as domain references.
- shadcn/ui components and PWA assets (manifest, icons, install prompt).
- Clean typecheck on TS 5.7 / React 19.

## What's Bad

### Architecture

- Planned scaffolding far ahead of need: Kafka, Kong, ArgoCD, EKS/GKE, 7 Go/Python microservices, Vault. Empty folders.
- **Two state systems.** About 1,750 lines of Zustand stores (`ui.ts` 602, `cache.ts` 536, `offline-sync.ts` 268, preferences, feature-gates) are almost entirely unused (only test utils import them). The app actually runs on React Contexts plus raw localStorage (`activities-context.tsx`). The auth Zustand store mirrors the context via `useAuthSync`. CLAUDE.md wrongly describes Zustand as the core pattern.
- **Two auth systems:** Firebase Auth for identity, Supabase for user rows, and a Cloud Function in between.

### Correctness

- Money stored as JS floats. Should be integer minor units plus a currency code.
- **Account balance is stored, not derived.** `add-expense-form` adds the transaction, then separately read-modify-writes `account.balance` with no Dexie transaction. `update`/`deleteTransaction` never adjust balance. Balances will drift.
- No UI to edit or delete a transaction.
- History, Monthly Spend, Notifications and group widgets run on hardcoded mock data (`lib/data.ts`). Mock data uses negative amounts; real data uses positive amount + type.

### Security & Backend

Target: `user-service/functions/src/index.ts` (684 lines).

- `/login` takes email + password and calls `signInWithPassword` server-side, then the client signs in again with the Firebase SDK. The password is sent twice. The client should authenticate directly and send only ID tokens.
- CORS set to `"*"`; no rate limiting on login/register.
- `featureLevel` hardcoded to `"registered"`, so premium is impossible.
- Email-change rollback is a no-op (`getUser` is called after the update).
- Noisy logs (key lengths, Supabase URL, full error dumps).
- Cruft files: `index.full.ts`, `simple.ts.backup`, `simple-test.ts`.

### Tooling & Dependencies

- `next-pwa` 5.6 is unmaintained (built for the Pages Router).
- Next 15.1.2 / React 19.0.0 are outdated with known security issues, including the critical Dec 2025 React Server Components RCE. Upgrade before redeploying.
- No lockfile on main; no CI.
- Debug pages are routable (`/test-auth`, `components/debug`).

## Rewrite vs Keep

| Area | Action |
| --- | --- |
| Expense form, category/tags UI, shadcn components, PWA assets | Keep, refactor lightly |
| Dexie data layer | Keep the idea; rewrite the model (integer money, derived balances, repository module with atomic writes) |
| Zustand stores | Delete unused ones; keep one small preferences store or contexts only (pick one) |
| Mock-data components | Rewrite on real data, or hide until built |
| Auth + user service | Rewrite around a single provider when cloud sync is needed |
| Go/Python services, Terraform, Helm, kind | Delete (recoverable from git history) |
| Broken tests | Fix for kept code, delete the rest |
| Docs (CLAUDE.md, README, TASK.md, next-steps) | Rewrite to match reality |

## Incremental Plan

Each phase is shippable on its own.

### Phase 0: Clean-up

1. [x] Work on branch `chore/phase-0-cleanup` from `origin/main`; [x] pushed for review.
2. [x] Upgrade Next/React to current patched versions (Next 15.5.29, React 19.3.1); replace `next-pwa` with Serwist; commit `pnpm-lock.yaml`.
3. [x] Make Firebase optional so `pnpm build` passes with no env vars.
4. [x] Delete dead Zustand stores, stub services, infra folders, debug pages.
5. [x] Get tests green (244 passing); [x] add GitHub Actions CI (lint, typecheck, test, build).
6. [x] Update README/docs to reflect reality.

### Phase 1: Personal Tracker MVP

- Integer cents.
- Derived balances.
- Dexie transactions for writes (with migration).
- Add a UUID sync id to records.
- Edit/delete transactions.
- History and Monthly Spend on real data.
- CSV export/import (the only backup for local data).
- Deploy to Vercel; dogfood for 2 weeks.

### Phase 2: Budgets & Insights (Local)

- Category and overall monthly budgets.
- 80%/100% warnings.
- Charts page.

### Phase 3: Accounts Depth

- Multiple accounts.
- Transfers.
- Recurring transactions.
- Savings goals as virtual accounts.

### Phase 4: Sign-in + Cloud Sync

**Recommended:** drop Firebase. Use Supabase Auth + Postgres with RLS, called directly from the client. Sync via PowerSync or Dexie Cloud, or last-write-wins on `updatedAt` with soft deletes. This replaces the Cloud Function.

### Phase 5: Groups & Splitting

- Comes after sync exists.
- `schema.sql` already models groups, members, split expenses, and shares.

### Phase 6: Smart Features

- Receipt scanning and statement import via a vision-capable LLM API call, not a separate Python service.
