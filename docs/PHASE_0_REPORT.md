# Phase 0 Report — Clean-up

| | |
|---|---|
| **Date** | 2026-11-08 |
| **Branch** | `chore/phase-0-cleanup` (based on origin/main @ 8e499e0, PR #25) |
| **Plan** | docs/ROADMAP.md (Phase 0) |
| **Implemented by** | AI coding agents (Claude) under Arghya's direction. Results were re-verified independently before commit. |

## TL;DR

- Phase 0 cleans up the repo so it reflects reality: dead code, placeholder services and stale docs are removed. Nothing live was removed.
- The app now builds and runs without any Firebase configuration. Previously the production build failed.
- Test suite: 164 failing tests (21 of 28 files) became 244 of 244 passing (25 of 25 files). No tests were skipped.
- Dependencies were upgraded to fix known security advisories. Next.js stays on 15.x. The PWA service worker moved from the unmaintained next-pwa to Serwist.
- A CI workflow now runs lint, typecheck, tests and build on every push to main and on every pull request.
- Not yet done: no manual browser or device testing, and the CI workflow has not run yet. Nothing is merged.

## Why Phase 0

- `main` had 164 failing tests and a failing production build, and nobody had noticed.
- Large amounts of dead code (empty backend scaffolds, unused stores, debug pages) and outdated docs described an architecture that did not exist. This misled contributors.
- Phase 0 makes the baseline trustworthy before any feature or data-model work (Phase 1 onward).

## Verification

All "After" results were re-run independently by the reviewing session, not only reported by the implementing agent.

| Check | Before (origin/main) | After | How verified |
|---|---|---|---|
| Lint (`pnpm lint`) | Not recorded | No ESLint warnings or errors | Re-run by reviewing session |
| Typecheck (`pnpm exec tsc --noEmit`) | 0 errors | 0 errors | Re-run by reviewing session |
| Tests (`pnpm vitest run`) | 164 of 238 failing (21 of 28 files failing) | 244 of 244 passing (25 of 25 files), 0 skipped | Re-run by reviewing session |
| Production build (`pnpm build`), no Firebase env vars | FAILED (`src/lib/firebase.ts` threw while prerendering `/offline`) | SUCCEEDS. All 8 routes prerendered as static: `/`, `/auth/login`, `/history`, `/notifications`, `/offline`, `/settings`, `/settings/account`, `/_not-found` | Re-run by reviewing session |
| User service build (`npm ci && npm run build` in `backend/services/user-service/functions`) | Not recorded | Builds cleanly | Re-run by reviewing session |
| Secret scan of staged diff | Not applicable | No API keys or tokens found. No `.env` files, build output, `node_modules` or generated service worker files committed. | Scan of staged diff |
| Manual browser / installed-PWA QA | Not applicable | Not done | Not verified |
| GitHub Actions CI run | Not applicable | Not yet run (runs on first push or PR) | Not verified |

## Changes by area

### 1. Removed dead and placeholder code

**What changed**

- 7 empty backend service scaffolds deleted: analytics, budget, expense, group, notification (Go); prediction, receipt-scanner (Python). 106 files, all placeholders with 0 lines of real code.
- `infrastructure/` deleted (Terraform, Helm, kind, values): 40 files, no working infrastructure.
  - Exception: the Supabase migrations and `seed.sql` were moved to `backend/db/supabase/`, not deleted. They are the only copy of the Supabase schema the user service depends on.
- Unused Zustand stores deleted: `ui.ts`, `cache.ts`, `offline-sync.ts`, `feature-gates.ts`, `preferences.ts` (about 1,750 lines), plus their 3 test files. The app runs on React Contexts (auth, db, activities). These stores were imported only by test utilities.
  - The auth Zustand store was kept because `use-auth-sync` uses it.
- Also deleted as unused: `hooks/use-network-status.ts`, `utils/network.ts`, `components/hoc` (unused swipe wrapper), `config/features.ts`, `lib/firebase-status.ts`.
- Debug code removed: `/test-auth` page and `components/debug`.
- User service leftovers removed: `index.full.ts`, `simple.ts.backup`, `simple-test.ts` (not part of the deployed function).

**Why**

- Dead code misled contributors and docs about the architecture and made maintenance harder.
- All deleted code is recoverable from git history. Each deletion was checked for live imports first.

**Risk: low.** Typecheck, tests and build confirm nothing live depended on the removed code.

### 2. Firebase is now optional

**What changed**

- `lib/firebase.ts` no longer throws at import. It initialises lazily and exports `isFirebaseConfigured`, `getFirebaseApp()` and `getFirebaseAuth()`. The old `auth`, `app` and `functions` exports were removed (`auth.service.ts` was the only user).
- `auth.service.ts` reports "Sign-in is not configured" when Firebase env vars are missing. The auth listener reports signed-out.
- `AuthContext` exposes `isAuthConfigured`. `LoginForm` shows a "Sign-in not configured" card.

**Why**

- The core product is local-first expense tracking with no sign-up. The app must build and run without any cloud configuration.

**Risk: medium-low.** Sign-in behaviour with Firebase configured is covered by unit tests but was not tested manually in a browser.

### 3. Dependency upgrades and security

**What changed**

| Package | Before | After |
|---|---|---|
| next | 15.1.2 | 15.5.29 |
| react / react-dom | 19.0.0 | 19.3.1 |
| eslint-config-next | 15.1.2 | 15.5.29 |
| next-pwa | 5.6 | Removed, replaced by Serwist 9.5.13 (`@serwist/next` + `serwist`) |
| @types/next-pwa, @types/webpack | present | Removed |

- New service worker at `pwa/src/app/sw.ts`. The `/offline` page is precached as the offline fallback. The previous NetworkFirst cache for `api.*` URLs is kept. The manifest is unchanged.
- Generated service worker files are gitignored. Browserslist database refreshed. `pnpm-lock.yaml` (already tracked) updated.

**Why**

- The old versions had known security vulnerabilities, including:
  - CVE-2025-55182 (critical React Server Components remote code execution, Dec 2025)
  - CVE-2025-29927 (Next.js middleware auth bypass)
- The new versions are newer than the releases that patched these.
- Stayed on Next 15 rather than 16.4.5 (current latest) because the service worker library (Serwist via `@serwist/next`) needs webpack, which Next 16 no longer uses by default.
- next-pwa is unmaintained and was built for the old Pages Router.

**Risk: medium.** Framework upgrade. Covered by build and tests, but offline and installed-PWA behaviour has not been tested on a device.

### 4. Tests repaired (164 failing to 0)

**Root causes**

- Firebase import throwing in tests.
- Missing providers and mocks.
- Tests written against an older UI.
- Leftover Jest syntax in a Vitest project.

**Test infrastructure changes**

- Added ResizeObserver and pointer-capture polyfills.
- Use jsdom's real `localStorage` instead of a mock.
- Global mock for `next/navigation`.
- `renderWithProviders` now wraps `AuthProvider` and `ActivitiesProvider`.
- `userEvent` `pointerEventsCheck` disabled.
- `jest.*` converted to `vi.*`.

**Rewritten to match current UI**

- Category-selector tests (the component is now a typed combobox, not a popover).
- Current-balance, recent-expenses, monthly-spend, group-stats, group-activity-feed, outstanding-balances, overview and activities-bar tests.
- Mock-data components now stub `@/lib/data`.

**Adjusted**

- account-selector, add-expense-form, add-expense-modal responsive, quick-actions, header and activities-context tests.

**Removed**

- Only the 3 store tests whose code was deleted. No tests were skipped.

**Risk: medium-low.** The rewritten tests reflect current behaviour, including some known imperfections (see Known issues). Passing tests do not mean the behaviour is final.

### 5. Small source fixes (found while fixing tests)

- `category-selector.tsx`: a 50 ms focus timer now has cleanup. Previously, typing into the next field right after choosing a category could lose focus and drop characters.
- `user-nav.tsx`: the avatar button has `aria-label="Open user menu"` (it had no accessible name).

### 6. Continuous integration added

**What changed**

- `.github/workflows/ci.yml` runs on pushes to main and on pull requests.
- Job `pwa`: pnpm 10, Node 20, frozen-lockfile install, then lint, typecheck, tests, build.
- Job `user-service`: `npm ci` and build.

**Why**

- Prevents the repo from silently rotting again. Main had 164 failing tests and a failing build with nobody noticing.

**Risk: low.** The workflow has not run yet. It will run on the first push or PR.

### 7. Documentation

- `README.md` rewritten to reflect reality: what works, how to run it, Firebase is optional, link to ROADMAP.
- `TASK.md` and `docs/next-steps.md` marked "Superseded" at the top and kept for history.
- `docs/ROADMAP.md` added (status review and phased plan), with Phase 0 items ticked.

## What was deliberately NOT changed

| Area | Status | Planned for |
|---|---|---|
| Data model (money stored as floating-point numbers; stored account balance) | Unchanged | Phase 1 |
| `lib/data.ts` mock data (still powers History, Monthly Spend, Notifications and group widgets) | Unchanged | Phase 1 |
| User service backend logic (login flow, CORS, hardcoded `featureLevel`) | Left as deployed | Phase 4 (auth rework) |
| Deployed Firebase function | Not redeployed or touched | Phase 4 |
| `backend/db/schema.sql` | Kept as domain reference | n/a |

## Known issues and follow-ups

1. Outdated docs still describe Zustand as the main state approach: `docs/architecture/tech-stack.md`, `docs/planning/development-phases.md`, `docs/CORE_EXPENSE_LOGGING_IMPLEMENTATION.md`.
2. The account dropdown formats balances as `$-150.75` and `$10000.00` (sign placement, no thousands separators). Tests currently assert this output. Fix in Phase 1 with integer money.
3. `pnpm test` starts watch mode (CI uses `vitest run`). The `test:stores` script now only covers the auth store test.
4. The activities bar hides group actions when signed out. This includes the case where Firebase is not configured.
5. `next lint` prints a deprecation notice (removed in Next 16). It will need migrating to the ESLint CLI when moving to Next 16.
6. On a machine with `pwa/.env.local` present, a plain `pnpm build` uses that Firebase config. The no-env build was proven with that file moved aside.
7. A local, untracked `CLAUDE.md` (AI assistant instructions) is outdated. It is not part of the repo.
8. No manual browser or device QA has been done yet.

## Decisions needed (for Sayan and Arghya)

1. **Merge:** decide whether and how this branch gets merged into main.
2. **Next 16:** stay on 15.5.x for now, or move to 16. Moving requires `@serwist/turbopack` or building with `--webpack`.
3. **Firebase function:** confirm it stays deployed until the Phase 4 auth rework, and agree on the Phase 4 direction. ROADMAP recommends Supabase Auth with Postgres and RLS, dropping Firebase.
4. **Superseded docs:** delete `TASK.md`, `next-steps.md` and the outdated architecture and planning docs, or keep them marked as historical.

## How to verify locally

```bash
cd pwa && pnpm install --frozen-lockfile && pnpm lint && pnpm exec tsc --noEmit && pnpm vitest run && pnpm build

cd backend/services/user-service/functions && npm ci && npm run build
```

For the no-Firebase check, temporarily move `pwa/.env.local` aside before `pnpm build`.

## How to roll back

- Nothing is merged. Delete the branch or do not merge it.
- After merge, `git revert` the merge commit.
- Deleted files are recoverable from git history, for example: `git checkout 8e499e0 -- <path>`.

## Change statistics

| Measure | Value |
|---|---|
| Files changed (total) | 209 (including this report) |
| Lines | +3,207 / -9,385 (including this report) |
| Files deleted | 164 |
| Files modified | 36 |
| Files added | 4 (CI workflow, sw.ts, ROADMAP.md, this report) |
| Files moved | 5 |
| Within `pwa/src` | 44 files changed, +964 / -3,631 |
