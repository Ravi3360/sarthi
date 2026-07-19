# SAATHI

Hindi-first mobile app (Expo/React Native) giving Indian blue-collar workers a verified digital professional identity: profile, document locker, government scheme discovery, income tracking, work history, skills passport, and job discovery.

Phase 1 is worker-side only — no employer, payments, or loan features.

## Monorepo layout

pnpm workspace, packages under `artifacts/*`, `lib/*`, `scripts`.

```
artifacts/
  saathi/       Expo Router app — the product (see below)
lib/
  db/                Drizzle ORM schema + Postgres client (unused by saathi)
  api-zod/           Zod schemas (unused by saathi)
  api-spec/          openapi.yaml + orval codegen config
  api-client-react/  Generated React Query client (currently unused by saathi)
scripts/        workspace-level utility scripts (post-merge hook, etc.)
```

### `artifacts/saathi/` — the app

- `app/` — expo-router screens: `auth/*` (language → phone → OTP), `onboarding/[step]` (12-step data-driven wizard), `(tabs)/*` (home, documents, schemes, income, profile), `schemes/[id]`, `profile/edit/[section]`, `skills/*`, `jobs/[id]`
- `services/` — Firestore-backed data layer, one module per domain (workers, documents, income, workHistory, skills, schemes, jobs, auth)
- `context/` — `AuthContext`, `WorkerContext`, `ToastContext`
- `constants/` — seed data (occupations, states, languages, govt schemes, jobs) + the `onboardingSteps` wizard config
- `i18n/hi.json` — primary (and only complete) translation file; `en.json` is a stub
- `components/ui.tsx`, `components/forms.tsx` — shared design-system primitives

## Setup

Requires **pnpm** (npm/yarn lockfiles are actively rejected — see root `package.json`'s `preinstall` script) and **Node.js 24**.

```
pnpm install
```

For the full environment setup needed to actually run/build SAATHI on a new machine (Firebase credentials, EAS/Firebase CLI login, dev-client build, emulator vs. real project) — see **[SETUP.md](SETUP.md)**.

## Run

```
pnpm --filter @workspace/saathi run dev     # SAATHI Expo app (see SETUP.md — needs a dev-client build, not Expo Go)
```

## Build / typecheck

```
pnpm run typecheck   # full typecheck across all packages
pnpm run build       # typecheck + build all packages
```

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- SAATHI: Expo Router (React Native), i18next/react-i18next (Hindi-first, `hi` default), Zod, react-native-svg
- Backend: Firebase (Firestore + Anonymous Auth + Storage + Cloud Functions), see SETUP.md

## Architecture decisions

- **Firebase backend integrated.** Firestore (+ Anonymous Auth + Storage) via `@react-native-firebase/*` replaces the earlier `AsyncStorage` data layer. The data model matches the spec's intended paths (`workers/{uid}`, `documents`, `workHistory`, `income`, `skills`, `schemes`, `jobs`). A custom EAS dev client is now required (plain Expo Go no longer works, since native Firebase modules are linked). See `docs/superpowers/specs/2026-07-18-firebase-backend-design.md` for the full schema and integration details.
- **Mock auth**: any valid 10-digit mobile number + OTP `123456` logs in; Firebase Anonymous Auth generates a stable uid linked to the phone number.
- **Govt schemes and job listings are static seed data** (`constants/schemes.ts`, `constants/jobs.ts`), read-only for now — mirroring what would be Firestore collections later.
- **Onboarding is fully data-driven**: a single `app/onboarding/[step].tsx` route renders whichever step config (from `constants/onboardingSteps.ts`) matches the URL param, instead of 12 near-duplicate screens.
- Deviated from spec in two places for simplicity: plain `useState` + Zod validation instead of `react-hook-form`, and a small custom `View`-based bar chart instead of `react-native-gifted-charts`.

## Gotchas

- Do not add the `uuid` package to the SAATHI app — it crashes in Expo Go. Use `utils/id.ts`'s `generateId()` instead.
- Keep `@react-native-community/datetimepicker` and `expo-document-picker` pinned to the versions Expo's compatibility check expects for the installed SDK, or `expo start` will warn on every boot.

## Notes

- See `replit.md` for the Replit-specific project brief this README is derived from.
