# SAATHI

A Hindi-first mobile app (Expo/React Native) that gives Indian blue-collar workers a verified digital professional identity: profile, document locker, government scheme discovery, income tracking, work history, and job discovery. Phase 1 is worker-side only — no employer, payments, or loan features.

## Run & Operate

- `pnpm --filter @workspace/saathi run dev` — run the SAATHI Expo app (workflow: `artifacts/saathi: expo`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, unused by SAATHI for now)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- SAATHI: Expo Router (React Native), i18next/react-i18next (Hindi-first, `hi` default), Zod, react-native-svg
- API: Express 5, DB: PostgreSQL + Drizzle ORM (not currently used by SAATHI)

## Where things live

- `artifacts/saathi/` — the SAATHI mobile app (root-path artifact)
  - `app/` — expo-router screens: `auth/*` (language → phone → OTP), `onboarding/[step]` (12-step data-driven wizard), `(tabs)/*` (home, documents, schemes, income, profile), `schemes/[id]`, `profile/edit/[section]`, `skills/*`, `jobs/[id]`
  - `services/` — AsyncStorage-backed data layer, one function set per domain (`workers`, `documents`, `income`, `workHistory`, `skills`, `schemes`, `jobs`, `auth`)
  - `context/` — `AuthContext`, `WorkerContext`, `ToastContext`
  - `constants/` — seed data (occupations, states, languages, govt schemes, jobs) and the `onboardingSteps` wizard config
  - `i18n/hi.json` — primary (and only complete) translation file; `en.json` is a stub
  - `components/ui.tsx`, `components/forms.tsx` — shared design-system primitives

## Architecture decisions

- **No Firebase yet.** The spec called for Firebase Auth (phone OTP) + Firestore + Storage with a `MOCK_AUTH` fallback. No Firebase integration is connected in this Replit project. Per user decision, Phase 1 uses on-device `AsyncStorage` whose data shapes exactly mirror the spec's intended Firestore document paths (`workers/{uid}`, `documents`, `workHistory`, `income`, `skills`), so swapping in real Firebase later only touches the `services/` layer.
- **Mock auth**: any valid 10-digit mobile number + OTP `123456` logs in; a stable uid is derived from the mobile number and stored locally.
- **Govt schemes and job listings are static seed data** (`constants/schemes.ts`, `constants/jobs.ts`), read-only for now — mirroring what would be Firestore collections later.
- **Onboarding is fully data-driven**: a single `app/onboarding/[step].tsx` route renders whichever step config (from `constants/onboardingSteps.ts`) matches the URL param, keeping all 12 steps in one file instead of 12 near-duplicate screens.
- Deviated from the original spec's exact stack in two places for simplicity: plain `useState` + Zod validation instead of `react-hook-form`, and a small custom `View`-based bar chart instead of `react-native-gifted-charts`.

## Product

- Hindi-language onboarding wizard building a full worker profile (personal, professional, financial, health)
- Document locker for Aadhaar/PAN/police verification/certificates etc.
- Government scheme discovery with automatic eligibility checks against the worker's profile
- Income and work-history tracking with monthly totals and a simple earnings chart
- Skills passport with a computed skill score
- Nearby job listings (view-only in Phase 1)

## User preferences

- Firebase wiring is intentionally deferred; do not add a Firebase integration without checking with the user first, since the on-device data layer was chosen explicitly to defer that decision.

## Gotchas

- Do not add the `uuid` package to the SAATHI app — it crashes in Expo Go. Use `utils/id.ts`'s `generateId()` instead.
- Keep `@react-native-community/datetimepicker` and `expo-document-picker` pinned to the versions Expo's compatibility check expects for the installed SDK, or `expo start` will warn on every boot.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo/React Native conventions used in `artifacts/saathi`
