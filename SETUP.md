# SAATHI — New Machine Setup

Everything needed to get `master` running for development on a fresh machine, beyond the one-line `pnpm install` in the root README. Read this top to bottom once; after that you'll only need the "Day-to-day" section.

## 0. Accounts you need access to (ask the project owner)

- **Firebase project** `saathi-11e20` — needs at least Editor role (Owner if you'll manage billing/service accounts).
- **Expo/EAS org** `himiitd960s-team` — needs to be invited as a member before `eas build`/`eas login` will work for you.
- **Apple ID with a Developer account** — only if you're building for iOS (device registration + provisioning).

## 1. Prerequisites

- **Node.js 24** (the repo's stated target; Node 22 has also worked in practice, but 24 is what's pinned in the plan/spec docs — prefer it).
- **pnpm** — required; the root `preinstall` script actively rejects `npm`/`yarn` lockfiles. `corepack enable` is the easiest way to get the right version.
- No global installs needed for `firebase-tools` or `eas-cli` — always invoke them via `npx`/`npx eas-cli@latest` so everyone uses the same pinned-ish version automatically.

## 2. Clone and install

```bash
git clone <repo-url>
cd sarthi
pnpm install
```

This installs the whole workspace, including `artifacts/saathi`. It does **not** install the Cloud Functions project's dependencies — that's a separate Node project (see step 4).

## 3. Firebase config files

- `artifacts/saathi/google-services.json` and `GoogleService-Info.plist` — **already committed to the repo.** Nothing to do; these are app-id-scoped, not secrets.
- `artifacts/saathi/service-account.json` — **gitignored, a real secret.** Only needed if you'll run `pnpm run seed:firestore` (i.e. reseed `govtSchemes`/`jobs`) or otherwise use the Firestore Admin SDK directly. To get it:
  1. Firebase Console → `saathi-11e20` → Project settings → **Service accounts** tab.
  2. "Generate new private key" → download → save as `artifacts/saathi/service-account.json`.
  3. Never commit this file (it's in `.gitignore` already — double check before any `git add -A`).

  Skip this file entirely if you're just running/building the app — it's only read by `scripts/seed-firestore.ts`, never by the app itself.

## 4. Cloud Functions project (separate from the app)

`artifacts/saathi/functions/` is its own Node.js project (deployed independently to Google's servers, not bundled into the mobile app) — install its deps separately:

```bash
cd artifacts/saathi/functions
npm install
cd ..
```

## 5. CLI logins

```bash
cd artifacts/saathi
npx firebase-tools login       # needs Firebase project access (step 0)
npx eas-cli@latest login       # needs EAS org membership (step 0)
```

`.firebaserc` already points at project `saathi-11e20` and `app.json` already has the EAS `projectId` — you shouldn't need to run `firebase use` or `eas init`.

## 6. Getting the app running on a device

**Plain Expo Go will not work.** Native `@react-native-firebase/*` modules are linked, which requires a custom EAS "dev client" build instead.

**Fastest path — use an existing build:**

```bash
npx eas-cli@latest build:list --platform android --limit 5
```

Pick the most recent `finished` build's Application Archive URL, install that `.apk` on an Android device/emulator (enable "install from unknown sources" — it's not a Play Store build).

**Or build your own** (needed for iOS, or if the existing build is stale relative to your branch):

```bash
# Android — no interactive prompts needed if credentials already exist:
npx eas-cli@latest build --profile development --platform android

# iOS — interactive: logs into your Apple ID and registers your device (ad-hoc provisioning):
npx eas-cli@latest build --profile development --platform ios
```

Takes ~15-20 minutes on EAS's cloud builders either way.

**Start Metro** (from `artifacts/saathi`):

```bash
npx expo start --dev-client --host lan
```

Open the installed dev-client app on your device (same WiFi network as your machine) — it should auto-connect. If not, use the app's "Enter URL manually" option with `<your-LAN-IP>:8081`.

## 7. Local dev without touching the real Firebase project (optional)

Run the local emulator suite instead of the real `saathi-11e20` data:

```bash
cd artifacts/saathi
pnpm run emulators
```

Then, in a local `.env` (gitignored, don't commit):

```
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=<your-machine's-LAN-IP>   # required on a physical device/Android emulator; omit for localhost-only iOS simulator
```

Emulator UI: `http://localhost:4000`.

## 8. Deploying rules / the Cloud Function to the real project

```bash
cd artifacts/saathi
npx firebase deploy --only firestore:rules,storage,functions
```

Two things that bite here:
- It's `storage`, **not** `storage:rules` — the latter is silently misparsed by firebase-tools as "a deploy target literally named `rules`" and always fails with `Could not find rules for the following storage targets: rules`.
- `functions/node_modules` must be installed first (step 4), or the predeploy `tsc` build fails with `Cannot find module 'firebase-functions/v2/https'`.
- Requires the Blaze (pay-as-you-go) billing plan enabled on the project (already done for `saathi-11e20`).
- The Cloud Function (`linkWorkerAuth`) and the Firestore database are both pinned to `asia-south1` (Mumbai) — keep them in the same region if you ever recreate either, or you'll pay a cross-region latency tax on every login.

## 9. Seeding government schemes / job listings

```bash
cd artifacts/saathi
pnpm run seed:firestore   # needs service-account.json (step 3)
```

Populates the `govtSchemes` and `jobs` Firestore collections from `constants/schemes.ts`/`constants/jobs.ts`. Safe to re-run — it overwrites by document id, doesn't duplicate.

## 10. Logging into the app

Any valid 10-digit mobile number + OTP **`123456`** (hardcoded mock, no real SMS — see `services/auth.ts`'s `MOCK_OTP`).

## Gotchas carried over from the main docs

- Never add the `uuid` package to `artifacts/saathi` — it crashes in Expo Go / on-device. Use `utils/id.ts`'s `generateId()`.
- `artifacts/api-server` was removed (unused scaffold) — if you see stale references to it anywhere, they're leftover docs, not a real dependency.
- `firebase-admin` must only ever be used in `scripts/seed-firestore.ts` and `artifacts/saathi/functions/` — never imported from the app itself (`artifacts/saathi`'s own source), since it carries privileged, rules-bypassing access.

## Day-to-day (once everything above is done once)

```bash
cd artifacts/saathi
npx expo start --dev-client --host lan
```

Keep the dev-client build on your device; you only need a new EAS build when a *native* dependency changes (new/updated `@react-native-firebase/*`, `expo-*` native modules, `app.json` plugin changes) — plain JS/TS changes hot-reload through Metro same as always.
