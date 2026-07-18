# SAATHI

Hindi-first mobile app (Expo/React Native) giving Indian blue-collar workers a verified digital professional identity: profile, document locker, government scheme discovery, income tracking, work history, skills passport, and job discovery.

Phase 1 is worker-side only — no employer, payments, or loan features.

## Monorepo layout

pnpm workspace, packages under `artifacts/*`, `lib/*`, `scripts`.

```
artifacts/
  saathi/       Expo Router app — the product (see below)
  api-server/   Express 5 + pino API server (port 5000; not yet wired to saathi)
lib/
  db/                Drizzle ORM schema + Postgres client
  api-zod/           Zod schemas, used by api-server
  api-spec/          openapi.yaml + orval codegen config
  api-client-react/  Generated React Query client (currently unused by saathi)
scripts/        workspace-level utility scripts (post-merge hook, etc.)
```

### `artifacts/saathi/` — the app

- `app/` — expo-router screens: `auth/*` (language → phone → OTP), `onboarding/[step]` (12-step data-driven wizard), `(tabs)/*` (home, documents, schemes, income, profile), `schemes/[id]`, `profile/edit/[section]`, `skills/*`, `jobs/[id]`
- `services/` — AsyncStorage-backed data layer, one module per domain (workers, documents, income, workHistory, skills, schemes, jobs, auth)
- `context/` — `AuthContext`, `WorkerContext`, `ToastContext`
- `constants/` — seed data (occupations, states, languages, govt schemes, jobs) + the `onboardingSteps` wizard config
- `i18n/hi.json` — primary (and only complete) translation file; `en.json` is a stub
- `components/ui.tsx`, `components/forms.tsx` — shared design-system primitives

## Setup

Requires **pnpm** (npm/yarn lockfiles are actively rejected — see root `package.json`'s `preinstall` script) and **Node.js 24**.

```
pnpm install
```

## Run

```
pnpm --filter @workspace/saathi run dev     # SAATHI Expo app
pnpm --filter @workspace/api-server run dev # API server (port 5000, unused by SAATHI for now)
```

## Build / typecheck

```
pnpm run typecheck   # full typecheck across all packages
pnpm run build       # typecheck + build all packages
```

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- SAATHI: Expo Router (React Native), i18next/react-i18next (Hindi-first, `hi` default), Zod, react-native-svg
- API: Express 5, DB: PostgreSQL + Drizzle ORM (not currently used by SAATHI)

## Architecture decisions

- **No Firebase yet.** Spec calls for Firebase Auth (phone OTP) + Firestore + Storage with a `MOCK_AUTH` fallback. Phase 1 uses on-device `AsyncStorage` whose data shapes mirror the spec's intended Firestore paths (`workers/{uid}`, `documents`, `workHistory`, `income`, `skills`), so swapping in real Firebase later only touches the `services/` layer. Do not add a Firebase integration without checking with the user first.
- **Mock auth**: any valid 10-digit mobile number + OTP `123456` logs in; a stable uid is derived from the mobile number and stored locally.
- **Govt schemes and job listings are static seed data** (`constants/schemes.ts`, `constants/jobs.ts`), read-only for now — mirroring what would be Firestore collections later.
- **Onboarding is fully data-driven**: a single `app/onboarding/[step].tsx` route renders whichever step config (from `constants/onboardingSteps.ts`) matches the URL param, instead of 12 near-duplicate screens.
- Deviated from spec in two places for simplicity: plain `useState` + Zod validation instead of `react-hook-form`, and a small custom `View`-based bar chart instead of `react-native-gifted-charts`.

## Gotchas

- Do not add the `uuid` package to the SAATHI app — it crashes in Expo Go. Use `utils/id.ts`'s `generateId()` instead.
- Keep `@react-native-community/datetimepicker` and `expo-document-picker` pinned to the versions Expo's compatibility check expects for the installed SDK, or `expo start` will warn on every boot.

## Notes

- See `replit.md` for the Replit-specific project brief this README is derived from.
