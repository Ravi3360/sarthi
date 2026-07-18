# SAATHI Firebase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SAATHI's AsyncStorage-only data layer with Firebase (Firestore + Auth + Storage via `@react-native-firebase/*`), so worker profiles, documents, income, work history, skills, government schemes and jobs are all backed by real Firestore/Storage instead of on-device dummy data — while keeping the schema simple enough to map cleanly onto a future Django/MySQL backend.

**Architecture:** `@react-native-firebase/{app,auth,firestore,storage}` (native modules, not the JS SDK — needed for real Firestore offline persistence). Anonymous Firebase Auth sits behind a mock OTP gate (hardcoded `1234`, no real SMS). A `phoneIndex/{mobile} → uid` lookup plus a `linkedAuthUids` array on each worker doc preserve "same mobile always returns the same data" despite anonymous-auth uids resetting on sign-out. `WorkerProfile` becomes a flat single-level document (previously nested `personal`/`professional`/`financial`/`health`). Documents, work history, income, and skills become Firestore subcollections under `workers/{uid}`. Govt schemes and jobs become top-level read-only Firestore collections seeded from the existing `constants/*.ts` arrays. Every `services/*.ts` file keeps its existing exported function signatures, so no screen needs to change its *data-fetching* code — only the flatten (Task 4) and the seed-data-bypass fixes (Task 8) touch `app/*` files.

**Tech Stack:** `@react-native-firebase/app` / `auth` / `firestore` / `storage`, `expo-dev-client`, EAS Build, `firebase-tools` (rules + emulators), `firebase-admin` (seed script only, Node/tsx).

## Global Constraints

- Node.js 24, TypeScript 5.9, pnpm workspaces, Expo SDK ~54, React Native 0.81.5, React 19.1.0, Expo Router ~6 — do not change these versions.
- Do not add the `uuid` package anywhere in `artifacts/saathi` — crashes in past Expo Go testing; `utils/id.ts`'s `generateId()` is the only id generator.
- App identifier `com.saathi.app` is used as both `ios.bundleIdentifier` and `android.package`.
- Mock OTP is hardcoded to `1234` (was `123456`) — no real SMS integration this round.
- Do not touch `artifacts/api-server` or `lib/db` — they stay unused by SAATHI.
- `artifacts/saathi` has **no test framework** (no Jest/Vitest) — the existing project convention is `pnpm --filter @workspace/saathi run typecheck` (tsc, no emit) plus manual verification in the running app. Every task below verifies with typecheck and, where the change has runtime behavior, an exact manual click-path against the Firebase emulator or a real project. Do not introduce a new test framework as part of this plan — out of scope.
- All Firestore/Storage paths, field names, and security rules must match `docs/superpowers/specs/2026-07-18-firebase-backend-design.md` verbatim.
- Firebase Admin SDK (`firebase-admin`) is used only in `scripts/seed-firestore.ts` (plain Node.js via `tsx`) — never imported from `artifacts/saathi`.
- Commit after every task.

---

## Task 1: Firebase project + native app registration + Expo/EAS config

**Files:**
- Modify: `artifacts/saathi/app.json`
- Modify: `artifacts/saathi/package.json`
- Create: `artifacts/saathi/eas.json`
- Create (downloaded from Firebase console, not authored): `artifacts/saathi/google-services.json`, `artifacts/saathi/GoogleService-Info.plist`

**Interfaces:**
- Produces: a Firebase project with Firestore (Native mode), Anonymous Auth, and Storage enabled; native Android/iOS apps registered under `com.saathi.app`; an installable EAS development dev client. Later tasks assume this project exists and that `@react-native-firebase/*` packages are installed.

- [ ] **Step 1: Create the Firebase project (manual, console)**

Go to https://console.firebase.google.com → "Add project" → name it (e.g. "saathi"). Disable Google Analytics (not needed). Note the **Project ID** shown after creation — you'll need it in Task 2.

- [ ] **Step 2: Register the Android app (manual, console)**

In the new project: "Add app" → Android. Package name: `com.saathi.app`. Skip the SHA-1 field for now (not needed for Anonymous Auth). Download `google-services.json` and save it to `artifacts/saathi/google-services.json`.

- [ ] **Step 3: Register the iOS app (manual, console)**

"Add app" → iOS. Bundle ID: `com.saathi.app`. Download `GoogleService-Info.plist` and save it to `artifacts/saathi/GoogleService-Info.plist`.

- [ ] **Step 4: Enable Firestore, Anonymous Auth, and Storage (manual, console)**

- Firestore Database → "Create database" → **Native mode** → pick a region (e.g. `asia-south1` for India) → start in **production mode** (rules are written in Task 2, before anything reads/writes for real).
- Authentication → "Get started" → Sign-in method → enable **Anonymous**.
- Storage → "Get started" → same region as Firestore → production mode.

- [ ] **Step 5: Add native config to `app.json`**

Modify `artifacts/saathi/app.json` — add `android.package`, `android.googleServicesFile`, `ios.bundleIdentifier`, `ios.googleServicesFile`, and the Firebase + build-properties plugins:

```json
{
  "expo": {
    "name": "SAATHI",
    "slug": "saathi",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "saathi",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.saathi.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.saathi.app",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/images/icon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://replit.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/firestore",
      "@react-native-firebase/storage",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "forceStaticLinking": [
              "RNFBApp",
              "RNFBAuth",
              "RNFBFirestore",
              "RNFBStorage"
            ]
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

- [ ] **Step 6: Install the Firebase native packages and dev client**

```bash
cd artifacts/saathi
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage expo-build-properties expo-dev-client
```

- [ ] **Step 7: Create `eas.json`**

Create `artifacts/saathi/eas.json`:

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 8: Log in to EAS and link the project (manual)**

```bash
cd artifacts/saathi
npx eas login
npx eas build:configure
```

Follow the prompts (creates/links an EAS project id, writes `extra.eas.projectId` into `app.json` automatically).

- [ ] **Step 9: Sanity-check the native config resolves**

```bash
cd artifacts/saathi
npx expo config --json | grep -i "com.saathi.app"
```

Expected: two matches (`bundleIdentifier` and `package`), confirming `app.json` parses and both platform identifiers are set.

- [ ] **Step 10: Kick off the development dev client build (manual, verification)**

```bash
cd artifacts/saathi
npx eas build --profile development --platform android
```

Expected: build queues and succeeds on the EAS dashboard (takes several minutes) — this is the real end-to-end confirmation that the native Firebase config (package name, `google-services.json`, plugins) is valid. Install the resulting `.apk`/build on a device or emulator once it finishes; you'll use it for manual verification in every later task instead of Expo Go.

- [ ] **Step 11: Run typecheck and commit**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes unchanged (no app code touched yet).

```bash
git add artifacts/saathi/app.json artifacts/saathi/package.json artifacts/saathi/pnpm-lock.yaml artifacts/saathi/eas.json artifacts/saathi/google-services.json artifacts/saathi/GoogleService-Info.plist
git commit -m "feat(saathi): add React Native Firebase native config and EAS dev client"
```

---

## Task 2: Firebase emulator config + security rules

**Files:**
- Create: `artifacts/saathi/firebase.json`
- Create: `artifacts/saathi/.firebaserc`
- Create: `artifacts/saathi/firestore.rules`
- Create: `artifacts/saathi/storage.rules`
- Modify: `artifacts/saathi/package.json` (add `firebase-tools`, `emulators` script)

**Interfaces:**
- Consumes: the Firebase project id from Task 1.
- Produces: a runnable local emulator suite (Firestore/Auth/Storage) and deployable security rules that later tasks develop and manually test against.

- [ ] **Step 1: Add `firebase-tools` and an `emulators` script**

Modify `artifacts/saathi/package.json`'s `scripts` and `devDependencies`:

```json
  "scripts": {
    "dev": "EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN EXPO_PUBLIC_REPL_ID=$REPL_ID REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN pnpm exec expo start --localhost --port $PORT --dev-client",
    "build": "node scripts/build.js",
    "serve": "node server/serve.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "emulators": "firebase emulators:start"
  },
```

(Note `--dev-client` added to the `dev` script — plain `expo start` no longer boots the app once native Firebase modules are linked.)

Add to `devDependencies`: `"firebase-tools": "^14.0.0"`.

- [ ] **Step 2: Create `.firebaserc`**

Create `artifacts/saathi/.firebaserc`, replacing `<your-project-id>` with the actual Project ID from Task 1 Step 1:

```json
{
  "projects": {
    "default": "<your-project-id>"
  }
}
```

- [ ] **Step 3: Create `firebase.json`**

Create `artifacts/saathi/firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

- [ ] **Step 4: Write `firestore.rules`**

Create `artifacts/saathi/firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /phoneIndex/{mobile} {
      allow read: if true;
      allow write: if false;
    }

    match /workers/{uid} {
      allow create: if request.auth != null && request.auth.uid == uid;
      allow read, update: if request.auth != null
        && (request.auth.uid == uid || request.auth.uid in resource.data.linkedAuthUids);
      allow delete: if false;

      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/workers/$(uid)).data.linkedAuthUids;
      }
    }

    match /govtSchemes/{id} {
      allow read: if true;
      allow write: if false;
    }
    match /jobs/{id} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

- [ ] **Step 5: Write `storage.rules`**

Create `artifacts/saathi/storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /workers/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.uid in firestore.get(/databases/(default)/documents/workers/$(uid)).data.linkedAuthUids;
    }
  }
}
```

- [ ] **Step 6: Install and start the emulators (manual verification)**

```bash
cd artifacts/saathi
pnpm install
pnpm run emulators
```

Expected: terminal prints emulator URLs for Auth (`9099`), Firestore (`8080`), Storage (`9199`), and the Emulator UI at `http://localhost:4000`. Open the UI in a browser and confirm all three emulators show as running, with the Firestore and Storage tabs showing the rules from Step 4/5 loaded (no syntax errors reported). Leave the emulators running for later tasks' manual verification steps; stop with `Ctrl+C` when done for now.

- [ ] **Step 7: Deploy rules to the real project (manual verification)**

```bash
cd artifacts/saathi
npx firebase deploy --only firestore:rules,storage
```

(Not `storage:rules` — for the `storage` product, the segment after `:` names a deploy *target* from `.firebaserc`, not a facet like `rules`; unlike `firestore:rules`/`firestore:indexes`, which the CLI special-cases, `storage:rules` is parsed as "only deploy target literally named `rules`", which doesn't exist, and fails with `Could not find rules for the following storage targets: rules`. Plain `storage` deploys rules for every configured storage target.)

Expected: both deploys succeed. Check the Firebase console's Firestore → Rules and Storage → Rules tabs show the content from Steps 4/5.

- [ ] **Step 8: Commit**

```bash
git add artifacts/saathi/firebase.json artifacts/saathi/.firebaserc artifacts/saathi/firestore.rules artifacts/saathi/storage.rules artifacts/saathi/package.json artifacts/saathi/pnpm-lock.yaml
git commit -m "feat(saathi): add Firebase emulator config and Firestore/Storage security rules"
```

---

## Task 3: `lib/firebase.ts` client module

**Files:**
- Create: `artifacts/saathi/lib/firebase.ts`

**Interfaces:**
- Consumes: `@react-native-firebase/{app,auth,firestore,storage}` (Task 1).
- Produces: `auth`, `db`, `storage` — the three RNFirebase instances every later `services/*.ts` file imports from `@/lib/firebase`.

- [ ] **Step 1: Write `lib/firebase.ts`**

Create `artifacts/saathi/lib/firebase.ts`:

```ts
import { getApp } from '@react-native-firebase/app';
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';

const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Set EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true (in a local .env, not committed)
 * to point the app at `pnpm run emulators` instead of the real project.
 * EXPO_PUBLIC_FIREBASE_EMULATOR_HOST defaults to localhost; on a physical
 * device or Android emulator, set it to your machine's LAN IP.
 */
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST ?? 'localhost';
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes (new file, unused as of yet, but must compile against the installed `@react-native-firebase/*` types).

- [ ] **Step 3: Commit**

```bash
git add artifacts/saathi/lib/firebase.ts
git commit -m "feat(saathi): add Firebase client module (auth/firestore/storage + emulator wiring)"
```

---

## Task 4: Flatten `WorkerProfile` + migrate `services/workers.ts` to Firestore

This is the largest task: `WorkerProfile` drops its nested `personal`/`professional`/`financial`/`health`/`profileMeta` sub-objects in favor of flat top-level fields (per the spec's migration-friendliness decision), and `services/workers.ts` moves from AsyncStorage to Firestore at the same time — both must land together for the app to typecheck and run.

**Files:**
- Modify: `artifacts/saathi/types/worker.ts`
- Modify: `artifacts/saathi/services/workers.ts`
- Modify: `artifacts/saathi/constants/onboardingSteps.ts`
- Modify: `artifacts/saathi/utils/eligibility.ts`
- Modify: `artifacts/saathi/app/index.tsx`
- Modify: `artifacts/saathi/app/(tabs)/home.tsx`
- Modify: `artifacts/saathi/app/(tabs)/profile.tsx`
- Modify: `artifacts/saathi/app/onboarding/[step].tsx`
- Modify: `artifacts/saathi/app/profile/edit/[section].tsx`

**Interfaces:**
- Consumes: `db` from `@/lib/firebase` (Task 3).
- Produces: flat `WorkerProfile` (fields listed below); `getWorker(uid): Promise<WorkerProfile|null>`, `saveWorker(worker): Promise<WorkerProfile>`, `ensureWorker(uid, mobile): Promise<WorkerProfile>`, `createEmptyWorker(uid, mobile): WorkerProfile`, `computeCompletionPercent(worker): number` — same signatures as today, consumed by `context/WorkerContext.tsx` (unchanged) and (from Task 5 onward) `services/auth.ts`.

- [ ] **Step 1: Rewrite `types/worker.ts`**

Replace the whole file:

```ts
export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'unmarried' | 'married' | 'widowed' | 'divorced';
export type Availability = 'full_time' | 'part_time' | 'on_call';
export type MigrationStatus = 'local' | 'migrant';
export type Education =
  | 'illiterate'
  | 'primary'
  | 'secondary'
  | 'higher_secondary'
  | 'graduate';

export type SchemeApplicationStatus = 'not_started' | 'applied' | 'approved';

export interface WorkerProfile {
  uid: string;
  mobile: string;
  name: string;
  gender: Gender | null;
  dob: string | null; // ISO date
  aadhaar: string; // stored masked
  pan: string; // stored masked
  maritalStatus: MaritalStatus | null;
  children: number;
  dependents: number;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  currentAddress: string;
  currentState: string;
  currentDistrict: string;
  nativeVillage: string;
  disability: string; // '' means no, otherwise description
  photoUrl: string | null;

  occupation: string;
  primarySkill: string;
  secondarySkills: string[];
  experienceYears: number;
  expectedSalary: number | null;
  currentEmployer: string;
  availability: Availability | null;
  education: Education | null;
  languages: string[];

  bankName: string;
  accountNoMasked: string;
  ifsc: string;
  upiId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;

  insuranceProvider: string;
  insuranceNo: string;
  govtSchemeStatus: string[];
  migrationStatus: MigrationStatus | null;

  policeVerified: boolean;
  aadhaarVerified: boolean;
  rating: number;
  completionPercent: number;
  createdAt: string;
  updatedAt: string;
  lastCompletedStep: number; // 0 = none, 12 = fully onboarded

  schemeApplications: Record<string, SchemeApplicationStatus>;
  /** Anonymous-auth uids authorized to read/write this doc. See services/auth.ts. */
  linkedAuthUids: string[];
}

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'police_verification'
  | 'driving_license'
  | 'certificate'
  | 'experience_letter'
  | 'salary_slip'
  | 'health_card';

export type DocumentStatus = 'uploaded' | 'pending' | 'verified';

export interface WorkerDocument {
  id: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface WorkHistoryEntry {
  id: string;
  employer: string;
  role: string;
  location: string;
  salary: number;
  startDate: string;
  endDate: string | null;
  reasonForLeaving: string;
  reference: string;
}

export type IncomeMode = 'cash' | 'upi';
export type IncomeSourceType = 'employer' | 'contractor';
export type IncomeStatus = 'received' | 'pending';

export interface IncomeEntry {
  id: string;
  amount: number;
  mode: IncomeMode;
  source: IncomeSourceType;
  sourceName: string;
  date: string;
  status: IncomeStatus;
}

export interface SkillEntry {
  id: string;
  name: string;
  verified: boolean;
  experienceYears: number;
  certificateUrl: string | null;
  rating: number;
  trainingDone: boolean;
}
```

- [ ] **Step 2: Rewrite `services/workers.ts`**

Replace the whole file:

```ts
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkerProfile } from '@/types/worker';

function nowIso(): string {
  return new Date().toISOString();
}

export function createEmptyWorker(uid: string, mobile: string): WorkerProfile {
  const now = nowIso();
  return {
    uid,
    mobile,
    name: '',
    gender: null,
    dob: null,
    aadhaar: '',
    pan: '',
    maritalStatus: null,
    children: 0,
    dependents: 0,
    permanentAddress: '',
    permanentState: '',
    permanentDistrict: '',
    currentAddress: '',
    currentState: '',
    currentDistrict: '',
    nativeVillage: '',
    disability: '',
    photoUrl: null,
    occupation: '',
    primarySkill: '',
    secondarySkills: [],
    experienceYears: 0,
    expectedSalary: null,
    currentEmployer: '',
    availability: null,
    education: null,
    languages: [],
    bankName: '',
    accountNoMasked: '',
    ifsc: '',
    upiId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceNo: '',
    govtSchemeStatus: [],
    migrationStatus: null,
    policeVerified: false,
    aadhaarVerified: false,
    rating: 0,
    completionPercent: 0,
    createdAt: now,
    updatedAt: now,
    lastCompletedStep: 0,
    schemeApplications: {},
    linkedAuthUids: [uid],
  };
}

const REQUIRED_FIELD_CHECKS: Array<(w: WorkerProfile) => boolean> = [
  (w) => !!w.name,
  (w) => !!w.gender,
  (w) => !!w.dob,
  (w) => !!w.aadhaar,
  (w) => !!w.pan,
  (w) => !!w.maritalStatus,
  (w) => !!w.photoUrl,
  (w) => !!w.permanentAddress,
  (w) => !!w.permanentState,
  (w) => !!w.currentAddress,
  (w) => !!w.occupation,
  (w) => !!w.primarySkill,
  (w) => !!w.expectedSalary,
  (w) => !!w.availability,
  (w) => !!w.education,
  (w) => w.languages.length > 0,
  (w) => !!w.bankName,
  (w) => !!w.accountNoMasked,
  (w) => !!w.emergencyContactName,
  (w) => !!w.emergencyContactPhone,
  (w) => !!w.migrationStatus,
];

export function computeCompletionPercent(worker: WorkerProfile): number {
  const passed = REQUIRED_FIELD_CHECKS.filter((check) => check(worker)).length;
  return Math.round((passed / REQUIRED_FIELD_CHECKS.length) * 100);
}

function workerDocRef(uid: string) {
  return doc(db, 'workers', uid);
}

export async function getWorker(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(workerDocRef(uid));
  return snap.exists() ? (snap.data() as WorkerProfile) : null;
}

export async function saveWorker(worker: WorkerProfile): Promise<WorkerProfile> {
  const updated: WorkerProfile = {
    ...worker,
    completionPercent: computeCompletionPercent(worker),
    updatedAt: nowIso(),
  };
  await setDoc(workerDocRef(worker.uid), updated);
  return updated;
}

export async function ensureWorker(uid: string, mobile: string): Promise<WorkerProfile> {
  const existing = await getWorker(uid);
  if (existing) return existing;
  const fresh = createEmptyWorker(uid, mobile);
  await setDoc(workerDocRef(uid), fresh);
  return fresh;
}
```

- [ ] **Step 3: Rewrite `constants/onboardingSteps.ts`**

Replace the whole file — every `key`/`parentKey`/`addressKey`/`stateKey`/`districtKey` string drops its `personal.`/`professional.`/`financial.`/`health.` prefix, and the `select` variant of `FieldDescriptor` gains `optional?: boolean` (removing the `as any` cast the old file needed on step 6's current-state field):

```ts
import { occupations } from "@/constants/occupations";
import { indianStates } from "@/constants/states";
import { workerLanguages } from "@/constants/languages";

export type FieldDescriptor =
  | {
      type: "text";
      key: string;
      label: string;
      keyboardType?: "default" | "numeric" | "phone-pad";
      maxLength?: number;
      prefix?: string;
      optional?: boolean;
      autoCapitalize?: "none" | "words" | "characters";
    }
  | {
      type: "chips";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      multi?: boolean;
      optional?: boolean;
    }
  | { type: "stepper"; key: string; label: string; min: number; max: number }
  | { type: "date"; key: string; label: string }
  | {
      type: "select";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      optional?: boolean;
    }
  | {
      type: "comboSelect";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      parentKey?: string;
      optional?: boolean;
    }
  | {
      type: "photo";
      key: string;
      label: string;
      circular?: boolean;
      optional?: boolean;
    }
  | { type: "occupationPicker"; key: string; label: string }
  | {
      type: "locationFill";
      label: string;
      addressKey: string;
      stateKey: string;
      districtKey: string;
    };

export interface OnboardingStep {
  step: number;
  title: string;
  fields: FieldDescriptor[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    step: 1,
    title: "बुनियादी जानकारी",
    fields: [
      {
        type: "text",
        key: "name",
        label: "पूरा नाम",
        autoCapitalize: "words",
      },
      {
        type: "chips",
        key: "gender",
        label: "लिंग",
        options: [
          { key: "male", label: "पुरुष" },
          { key: "female", label: "महिला" },
          { key: "other", label: "अन्य" },
        ],
      },
      { type: "date", key: "dob", label: "जन्म तिथि" },
    ],
  },
  {
    step: 2,
    title: "पहचान दस्तावेज़",
    fields: [
      {
        type: "text",
        key: "aadhaar",
        label: "आधार नंबर",
        keyboardType: "numeric",
        maxLength: 12,
      },
      {
        type: "text",
        key: "pan",
        label: "पैन नंबर (वैकल्पिक)",
        maxLength: 10,
        optional: true,
        autoCapitalize: "characters",
      },
    ],
  },
  {
    step: 3,
    title: "पारिवारिक जानकारी",
    fields: [
      {
        type: "chips",
        key: "maritalStatus",
        label: "वैवाहिक स्थिति",
        options: [
          { key: "unmarried", label: "अविवाहित" },
          { key: "married", label: "विवाहित" },
          { key: "widowed", label: "विधवा/विधुर" },
          { key: "divorced", label: "तलाकशुदा" },
        ],
      },
      {
        type: "stepper",
        key: "children",
        label: "बच्चों की संख्या",
        min: 0,
        max: 15,
      },
      {
        type: "stepper",
        key: "dependents",
        label: "आश्रितों की संख्या",
        min: 0,
        max: 15,
      },
    ],
  },
  {
    step: 4,
    title: "फ़ोटो व स्वास्थ्य",
    fields: [
      {
        type: "photo",
        key: "photoUrl",
        label: "अपनी फ़ोटो लगाएँ",
        circular: true,
      },
      {
        type: "text",
        key: "disability",
        label: "दिव्यांगता (अगर कोई हो)",
        optional: true,
      },
    ],
  },
  {
    step: 5,
    title: "स्थायी पता",
    fields: [
      {
        type: "locationFill",
        label: "GPS से पता भरें",
        addressKey: "permanentAddress",
        stateKey: "permanentState",
        districtKey: "permanentDistrict",
      },
      { type: "text", key: "permanentAddress", label: "स्थायी पता" },
      {
        type: "select",
        key: "permanentState",
        label: "राज्य चुनें",
        options: indianStates.map((s) => ({ key: s, label: s })),
      },
      {
        type: "comboSelect",
        key: "permanentDistrict",
        label: "जिला चुनें",
        options: [],
        parentKey: "permanentState",
        optional: true,
      },
    ],
  },
  {
    step: 6,
    title: "वर्तमान पता",
    fields: [
      {
        type: "locationFill",
        label: "GPS से पता भरें",
        addressKey: "currentAddress",
        stateKey: "currentState",
        districtKey: "currentDistrict",
      },
      { type: "text", key: "currentAddress", label: "वर्तमान पता" },
      {
        type: "select",
        key: "currentState",
        label: "राज्य चुनें (वर्तमान)",
        options: indianStates.map((s) => ({ key: s, label: s })),
        optional: true,
      },
      {
        type: "comboSelect",
        key: "currentDistrict",
        label: "जिला चुनें (वर्तमान)",
        options: [],
        parentKey: "currentState",
        optional: true,
      },
      {
        type: "text",
        key: "nativeVillage",
        label: "मूल गाँव/शहर",
        optional: true,
      },
    ],
  },
  {
    step: 7,
    title: "व्यवसाय चुनें",
    fields: [
      {
        type: "occupationPicker",
        key: "occupation",
        label: "व्यवसाय चुनें",
      },
    ],
  },
  {
    step: 8,
    title: "कौशल व अनुभव",
    fields: [
      { type: "text", key: "primarySkill", label: "मुख्य कौशल" },
      {
        type: "stepper",
        key: "experienceYears",
        label: "अनुभव (साल)",
        min: 0,
        max: 50,
      },
    ],
  },
  {
    step: 9,
    title: "वेतन व उपलब्धता",
    fields: [
      {
        type: "text",
        key: "expectedSalary",
        label: "अपेक्षित वेतन (₹/महीना)",
        keyboardType: "numeric",
        prefix: "₹",
      },
      {
        type: "chips",
        key: "availability",
        label: "उपलब्धता",
        options: [
          { key: "full_time", label: "फुल-टाइम" },
          { key: "part_time", label: "पार्ट-टाइम" },
          { key: "on_call", label: "ऑन-कॉल" },
        ],
      },
    ],
  },
  {
    step: 10,
    title: "शिक्षा व भाषाएँ",
    fields: [
      {
        type: "chips",
        key: "education",
        label: "शिक्षा",
        options: [
          { key: "illiterate", label: "निरक्षर" },
          { key: "primary", label: "प्राथमिक" },
          { key: "secondary", label: "माध्यमिक" },
          { key: "higher_secondary", label: "उच्चतर माध्यमिक" },
          { key: "graduate", label: "स्नातक+" },
        ],
      },
      {
        type: "chips",
        key: "languages",
        label: "भाषाएँ",
        multi: true,
        options: workerLanguages.map((l) => ({ key: l, label: l })),
      },
    ],
  },
  {
    step: 11,
    title: "बैंक जानकारी",
    fields: [
      { type: "text", key: "bankName", label: "बैंक का नाम" },
      {
        type: "text",
        key: "accountNoMasked",
        label: "खाता नंबर",
        keyboardType: "numeric",
      },
      {
        type: "text",
        key: "ifsc",
        label: "IFSC कोड",
        autoCapitalize: "characters",
        optional: true,
      },
      {
        type: "text",
        key: "upiId",
        label: "UPI आईडी (वैकल्पिक)",
        optional: true,
      },
    ],
  },
  {
    step: 12,
    title: "आपातकालीन संपर्क",
    fields: [
      {
        type: "text",
        key: "emergencyContactName",
        label: "आपातकालीन संपर्क नाम",
        autoCapitalize: "words",
      },
      {
        type: "text",
        key: "emergencyContactPhone",
        label: "आपातकालीन संपर्क नंबर",
        keyboardType: "phone-pad",
        maxLength: 10,
      },
      {
        type: "chips",
        key: "migrationStatus",
        label: "प्रवासन स्थिति",
        options: [
          { key: "local", label: "स्थानीय" },
          { key: "migrant", label: "प्रवासी" },
        ],
      },
    ],
  },
];

export const TOTAL_ONBOARDING_STEPS = onboardingSteps.length;
```

- [ ] **Step 4: Rewrite `utils/eligibility.ts`**

Replace the whole file:

```ts
import type { EligibilityCheck, GovtScheme } from '@/types/scheme';
import type { WorkerProfile } from '@/types/worker';
import { calculateAge } from '@/utils/format';

export function checkEligibility(
  scheme: GovtScheme,
  worker: WorkerProfile,
): EligibilityCheck {
  const reasons: EligibilityCheck['reasons'] = [];
  const age = calculateAge(worker.dob);
  const { eligibility } = scheme;

  if (eligibility.minAge !== null || eligibility.maxAge !== null) {
    const min = eligibility.minAge ?? 0;
    const max = eligibility.maxAge ?? 200;
    const pass = age !== null && age >= min && age <= max;
    reasons.push({
      label: 'उम्र',
      pass,
      detail: age !== null ? `${age} साल` : 'दर्ज नहीं',
    });
  }

  if (eligibility.gender !== 'any') {
    const pass = worker.gender === eligibility.gender;
    reasons.push({
      label: 'लिंग',
      pass,
      detail: worker.gender ?? 'दर्ज नहीं',
    });
  }

  if (eligibility.occupationTags.length > 0) {
    const pass = eligibility.occupationTags.includes(worker.occupation);
    reasons.push({
      label: 'व्यवसाय',
      pass,
      detail: worker.occupation || 'दर्ज नहीं',
    });
  }

  if (eligibility.incomeCeiling !== null) {
    const income = worker.expectedSalary ?? 0;
    const pass = income > 0 && income <= eligibility.incomeCeiling;
    reasons.push({
      label: 'आय सीमा',
      pass,
      detail: income > 0 ? `₹${income}/महीना` : 'दर्ज नहीं',
    });
  }

  if (eligibility.migrationRequired !== null) {
    const isMigrant = worker.migrationStatus === 'migrant';
    const pass = isMigrant === eligibility.migrationRequired;
    reasons.push({
      label: 'प्रवासन स्थिति',
      pass,
      detail: worker.migrationStatus ?? 'दर्ज नहीं',
    });
  }

  const eligible = reasons.length === 0 || reasons.every((r) => r.pass);
  return { eligible, reasons };
}
```

- [ ] **Step 5: Update `app/index.tsx`**

Change lines 28 and 31:

```tsx
    if (worker && worker.completionPercent >= 60) {
      return <Redirect href="/(tabs)/home" />;
    }
    const nextStep = worker ? Math.min(worker.lastCompletedStep + 1, 12) : 1;
```

(was `worker.profileMeta.completionPercent` / `worker.profileMeta.lastCompletedStep`.)

- [ ] **Step 6: Update `app/(tabs)/home.tsx`**

Change the header row and completion card (was lines 64, 67, 69–72, 75, 78, 83, 87):

```tsx
        <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {t('home.greeting', { name: worker.name || 'साथी' })}
          </Text>
          {worker.occupation ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              {getOccupation(worker.occupation)?.labelHi}
            </Text>
          ) : null}
        </View>
        <ProgressRing percent={worker.completionPercent} size={52} />
      </View>

      {worker.completionPercent < 100 && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                {t('profile.completion', { percent: worker.completionPercent })}
              </Text>
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push(`/onboarding/${Math.min(worker.lastCompletedStep + 1, 12)}`)}
              >
                {t('home.completeProfile')} →
              </Text>
            </View>
          </View>
        </Card>
      )}
```

- [ ] **Step 7: Update `app/(tabs)/profile.tsx`**

Change the header card and info card (was lines 36–37, 38–39, 42–43, 46, 51–53):

```tsx
        <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={72} />
        <Text style={[styles.name, { color: colors.foreground }]}>{worker.name || 'नाम दर्ज नहीं'}</Text>
        {worker.occupation ? (
          <Text style={{ color: colors.mutedForeground }}>{getOccupation(worker.occupation)?.labelHi}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {worker.aadhaarVerified && <Badge label={t('profile.aadhaarVerified')} tone="success" />}
          {worker.policeVerified && <Badge label={t('profile.policeVerified')} tone="success" />}
        </View>
        <View style={{ marginTop: 12 }}>
          <ProgressRing percent={worker.completionPercent} size={64} />
        </View>
      </View>

      <Card>
        <Row label="मोबाइल" value={`+91 ${worker.mobile}`} />
        <Row label="आधार" value={worker.aadhaar ? maskAadhaar(worker.aadhaar) : '—'} />
        <Row label="पैन" value={worker.pan ? maskPan(worker.pan) : '—'} last />
      </Card>
```

- [ ] **Step 8: Update `app/onboarding/[step].tsx`**

Change the `isValid` key checks (was lines 99–100):

```tsx
      if ((field as any).key === 'aadhaar') return isValidAadhaar(String(value ?? ''));
      if ((field as any).key === 'pan') return true; // optional handled above
```

Change the `goNext` draft update (was lines 119–125) — no more `profileMeta` wrapper:

```tsx
    try {
      const nextStepDraft: WorkerProfile = {
        ...draft,
        lastCompletedStep: Math.max(draft.lastCompletedStep, stepNumber),
      };
      await updateWorker(() => nextStepDraft);
```

Change the bank-name field branch and PAN/IFSC error checks (was lines 172, 179–180, 196, 200):

```tsx
            case 'text':
              if (field.key === 'bankName') {
                return (
                  <BankSuggestField
                    key={field.key}
                    bankName={value === null || value === undefined ? '' : String(value)}
                    onBankNameChange={(text) => set(field.key, text)}
                    onIfscSelect={(bankName, ifsc) => {
                      set('bankName', bankName);
                      set('ifsc', ifsc);
                    }}
                  />
                );
              }
              return (
                <FieldInput
                  key={field.key}
                  label={field.label}
                  value={value === null || value === undefined ? '' : String(value)}
                  onChangeText={(text) => set(field.key, text)}
                  keyboardType={field.keyboardType}
                  maxLength={field.maxLength}
                  prefix={field.prefix}
                  autoCapitalize={field.autoCapitalize ?? 'none'}
                  error={
                    field.key === 'pan' && value
                      ? isValidPan(String(value))
                        ? null
                        : 'सही पैन नंबर डालें'
                      : field.key === 'ifsc' && value
                        ? isValidIfsc(String(value))
                          ? null
                          : 'सही IFSC कोड डालें (जैसे SBIN0001234)'
                        : null
                  }
                />
              );
```

- [ ] **Step 9: Update `app/profile/edit/[section].tsx`**

Replace the `sectionConfig` object (was lines 18–73):

```tsx
const sectionConfig: Record<string, { title: string; fields: FieldDescriptor[] }> = {
  personal: {
    title: 'व्यक्तिगत जानकारी',
    fields: [
      { type: 'photo', key: 'photoUrl', label: 'फ़ोटो', circular: true, optional: true },
      { type: 'text', key: 'name', label: 'पूरा नाम', autoCapitalize: 'words' },
      { type: 'date', key: 'dob', label: 'जन्म तिथि' },
      { type: 'text', key: 'permanentAddress', label: 'स्थायी पता' },
      { type: 'select', key: 'permanentState', label: 'राज्य', options: indianStates.map((s) => ({ key: s, label: s })) },
      { type: 'text', key: 'currentAddress', label: 'वर्तमान पता' },
    ],
  },
  professional: {
    title: 'पेशेवर जानकारी',
    fields: [
      { type: 'text', key: 'primarySkill', label: 'मुख्य कौशल' },
      { type: 'stepper', key: 'experienceYears', label: 'अनुभव (साल)', min: 0, max: 50 },
      { type: 'text', key: 'expectedSalary', label: 'अपेक्षित वेतन (₹)', keyboardType: 'numeric', prefix: '₹' },
      { type: 'text', key: 'currentEmployer', label: 'वर्तमान नियोक्ता', optional: true },
      {
        type: 'chips',
        key: 'languages',
        label: 'भाषाएँ',
        multi: true,
        options: workerLanguages.map((l) => ({ key: l, label: l })),
      },
    ],
  },
  financial: {
    title: 'बैंक जानकारी',
    fields: [
      { type: 'text', key: 'bankName', label: 'बैंक का नाम' },
      { type: 'text', key: 'accountNoMasked', label: 'खाता नंबर', keyboardType: 'numeric' },
      { type: 'text', key: 'ifsc', label: 'IFSC कोड', autoCapitalize: 'characters' },
      { type: 'text', key: 'upiId', label: 'UPI आईडी', optional: true },
      { type: 'text', key: 'emergencyContactName', label: 'आपातकालीन संपर्क नाम', autoCapitalize: 'words' },
      { type: 'text', key: 'emergencyContactPhone', label: 'आपातकालीन संपर्क नंबर', keyboardType: 'phone-pad', maxLength: 10 },
    ],
  },
  health: {
    title: 'स्वास्थ्य व योजनाएँ',
    fields: [
      { type: 'text', key: 'insuranceProvider', label: 'बीमा कंपनी', optional: true },
      { type: 'text', key: 'insuranceNo', label: 'बीमा नंबर', optional: true },
      {
        type: 'chips',
        key: 'migrationStatus',
        label: 'प्रवासन स्थिति',
        options: [
          { key: 'local', label: 'स्थानीय' },
          { key: 'migrant', label: 'प्रवासी' },
        ],
      },
    ],
  },
};
```

- [ ] **Step 10: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes with zero errors. If any error remains referencing `.personal.`/`.professional.`/`.financial.`/`.health.`/`.profileMeta.`, grep the file it names and fix — it means a reference was missed.

- [ ] **Step 11: Manual verification (against the Firebase emulator)**

With `pnpm run emulators` running (Task 2 Step 6) and `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` set in a local `.env`, launch the dev client build from Task 1 and run through onboarding steps 1–12 end to end (you won't be able to log in yet — Task 5 wires up auth — so for this task's verification, temporarily hardcode a test uid in `context/WorkerContext.tsx`'s `load()` call, e.g. `workersService.ensureWorker('test-uid-1', '9876543210')`, to exercise the onboarding flow, then revert that temporary hardcode before committing). Confirm: every field saves and reloads correctly, the completion ring updates, and the Firestore emulator UI (`http://localhost:4000/firestore`) shows a flat `workers/test-uid-1` document with no nested objects.

- [ ] **Step 12: Commit**

```bash
git add artifacts/saathi/types/worker.ts artifacts/saathi/services/workers.ts artifacts/saathi/constants/onboardingSteps.ts artifacts/saathi/utils/eligibility.ts artifacts/saathi/app/index.tsx "artifacts/saathi/app/(tabs)/home.tsx" "artifacts/saathi/app/(tabs)/profile.tsx" "artifacts/saathi/app/onboarding/[step].tsx" "artifacts/saathi/app/profile/edit/[section].tsx"
git commit -m "feat(saathi): flatten WorkerProfile and migrate services/workers.ts to Firestore"
```

---

## Task 5: `services/auth.ts` + `context/AuthContext.tsx` — anonymous auth + mock OTP

**Files:**
- Modify: `artifacts/saathi/services/auth.ts`
- Modify: `artifacts/saathi/context/AuthContext.tsx`
- Modify: `artifacts/saathi/services/storageKeys.ts`

**Interfaces:**
- Consumes: `auth`, `db` from `@/lib/firebase` (Task 3); `ensureWorker`, `getWorker` from `@/services/workers` (Task 4).
- Produces: `sendOtp(mobile): Promise<{success:true}>`, `verifyOtp(mobile, otp): Promise<{success:boolean; uid:string|null}>`, `signOut(): Promise<void>` — same signatures `context/AuthContext.tsx` already calls; `AuthContextValue` (`uid`, `mobile`, `isLoading`, `sendOtp`, `verifyOtp`, `signOut`) unchanged, consumed as-is by `context/WorkerContext.tsx` and every screen using `useAuth()`.

- [ ] **Step 1: Rewrite `services/auth.ts`**

Replace the whole file:

```ts
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from '@react-native-firebase/firestore';
import { signInAnonymously, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ensureWorker } from '@/services/workers';

export const MOCK_OTP = '1234';

function phoneIndexRef(mobile: string) {
  return doc(db, 'phoneIndex', mobile);
}

export async function sendOtp(mobile: string): Promise<{ success: true }> {
  // Simulated network delay so the UI feels real. No real SMS is sent.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

export async function verifyOtp(
  mobile: string,
  otp: string,
): Promise<{ success: boolean; uid: string | null }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (otp !== MOCK_OTP) {
    return { success: false, uid: null };
  }

  const indexSnap = await getDoc(phoneIndexRef(mobile));
  const credential = await signInAnonymously(auth);
  const freshUid = credential.user.uid;

  if (indexSnap.exists()) {
    // Returning worker: their real data lives under a uid from a previous
    // anon session. Link this fresh anon session to that worker doc.
    const resolvedUid = (indexSnap.data() as { uid: string }).uid;
    await updateDoc(doc(db, 'workers', resolvedUid), {
      linkedAuthUids: arrayUnion(freshUid),
    });
    return { success: true, uid: resolvedUid };
  }

  // First-ever signup for this mobile: the fresh anon uid IS the worker id.
  await setDoc(phoneIndexRef(mobile), { uid: freshUid });
  await ensureWorker(freshUid, mobile);
  return { success: true, uid: freshUid };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
```

- [ ] **Step 2: Rewrite `context/AuthContext.tsx`**

Replace the whole file:

```tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from '@react-native-firebase/auth';
import { auth } from '@/lib/firebase';
import * as authService from '@/services/auth';
import { getWorker } from '@/services/workers';

interface AuthContextValue {
  uid: string | null;
  mobile: string | null;
  isLoading: boolean;
  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // While an explicit verifyOtp() call is resolving the real worker uid
  // (which may differ from auth.currentUser.uid on a phoneIndex-based
  // re-login, see services/auth.ts), ignore the onAuthStateChanged event
  // that signInAnonymously() itself triggers, so the two don't race.
  const resolvingLoginRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (resolvingLoginRef.current) return;
      if (!user) {
        setUid(null);
        setMobile(null);
        setIsLoading(false);
        return;
      }
      const worker = await getWorker(user.uid);
      setUid(user.uid);
      setMobile(worker?.mobile ?? null);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      uid,
      mobile,
      isLoading,
      sendOtp: async (m: string) => {
        await authService.sendOtp(m);
      },
      verifyOtp: async (m: string, otp: string) => {
        resolvingLoginRef.current = true;
        try {
          const result = await authService.verifyOtp(m, otp);
          if (result.success && result.uid) {
            setUid(result.uid);
            setMobile(m);
          }
          return result.success;
        } finally {
          resolvingLoginRef.current = false;
        }
      },
      signOut: async () => {
        await authService.signOut();
        setUid(null);
        setMobile(null);
      },
    }),
    [uid, mobile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes. `services/storageKeys.ts` still has its full original content (`currentUid`/`worker`/`documents`/`workHistory`/`income`/`skills` keys) at this point — `services/auth.ts` and `context/AuthContext.tsx` simply no longer import it, which is not a type error, just dead exports. It gets trimmed down to only `locale` in Task 7 Step 5, once `documents.ts`/`income.ts`/`workHistory.ts`/`skills.ts` (the other AsyncStorage-based consumers of that file) have also moved to Firestore.

- [ ] **Step 4: Manual verification (against the Firebase emulator)**

With emulators running and `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`, launch the dev client, go through language → phone entry → OTP screen. Enter any 10-digit mobile number and OTP `1234`. Confirm: login succeeds, you land on onboarding (or home, if a worker doc already exists for that mobile from Task 4's manual test). In the Firestore emulator UI, confirm a `phoneIndex/{mobile}` doc exists with a `uid` field, and a matching `workers/{uid}` doc with `linkedAuthUids: [uid]`. Sign out (Profile tab → लॉग आउट करें), then log back in with the **same mobile** and OTP `1234` again. Confirm: your previously entered data is still there, and in the emulator UI the `workers/{uid}` doc's `linkedAuthUids` array now has **two** entries.

- [ ] **Step 5: Commit**

```bash
git add artifacts/saathi/services/auth.ts artifacts/saathi/context/AuthContext.tsx
git commit -m "feat(saathi): switch auth to anonymous Firebase Auth behind mock-OTP-1234 gate"
```

---

## Task 6: Storage integration — documents + profile photo

**Files:**
- Create: `artifacts/saathi/services/storage.ts`
- Modify: `artifacts/saathi/services/documents.ts`
- Modify: `artifacts/saathi/app/(tabs)/documents.tsx`
- Modify: `artifacts/saathi/app/onboarding/[step].tsx`
- Modify: `artifacts/saathi/app/profile/edit/[section].tsx`

**Interfaces:**
- Consumes: `db`, `storage` from `@/lib/firebase` (Task 3).
- Produces: `uploadFile(path, localUri): Promise<string>` (in `services/storage.ts`, used by both documents and profile-photo uploads); `listDocuments(uid): Promise<WorkerDocument[]>`, `upsertDocument(uid, input): Promise<WorkerDocument>` (input now takes `fileUri` instead of `fileUrl`), `deleteDocument(uid, type): Promise<void>`.

- [ ] **Step 1: Create `services/storage.ts`**

Create `artifacts/saathi/services/storage.ts`:

```ts
import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { storage } from '@/lib/firebase';

/** Uploads a local file (file:// URI) to Firebase Storage and returns its download URL. */
export async function uploadFile(path: string, localUri: string): Promise<string> {
  const fileRef = ref(storage, path);
  await putFile(fileRef, localUri);
  return getDownloadURL(fileRef);
}
```

- [ ] **Step 2: Rewrite `services/documents.ts`**

Replace the whole file:

```ts
import { collection, doc, getDocs, setDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/services/storage';
import type { DocumentType, WorkerDocument } from '@/types/worker';

export const documentTypes: DocumentType[] = [
  'aadhaar',
  'pan',
  'police_verification',
  'driving_license',
  'certificate',
  'experience_letter',
  'salary_slip',
  'health_card',
];

function documentsCollection(uid: string) {
  return collection(db, 'workers', uid, 'documents');
}

export async function listDocuments(uid: string): Promise<WorkerDocument[]> {
  const snap = await getDocs(documentsCollection(uid));
  return snap.docs.map((d) => d.data() as WorkerDocument);
}

export async function upsertDocument(
  uid: string,
  input: {
    type: DocumentType;
    fileUri: string;
    fileName: string;
    mimeType: string;
  },
): Promise<WorkerDocument> {
  const extMatch = input.fileName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '';
  const fileUrl = await uploadFile(`workers/${uid}/documents/${input.type}${ext}`, input.fileUri);

  const document: WorkerDocument = {
    id: input.type,
    type: input.type,
    fileUrl,
    fileName: input.fileName,
    mimeType: input.mimeType,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
  };
  await setDoc(doc(documentsCollection(uid), input.type), document);
  return document;
}

export async function deleteDocument(uid: string, type: DocumentType): Promise<void> {
  await deleteDoc(doc(documentsCollection(uid), type));
}
```

- [ ] **Step 3: Update the two `upsertDocument` call sites in `app/(tabs)/documents.tsx`**

Change line 43:

```tsx
        await upsertDocument(worker.uid, { type: activeType, fileUri: file.uri, fileName: file.name, mimeType: file.mimeType });
```

Change lines 56–61:

```tsx
        await upsertDocument(worker.uid, {
          type: activeType,
          fileUri: asset.uri,
          fileName: asset.fileName ?? `${activeType}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
```

- [ ] **Step 4: Wire the profile-photo field to upload to Storage in `app/onboarding/[step].tsx`**

Change the `photo` case (was lines 258–267):

```tsx
            case 'photo':
              return (
                <PhotoPickerField
                  key={field.key}
                  label={field.label}
                  value={value ?? null}
                  onChange={(uri) => {
                    // Show the picked photo immediately; swap in the real
                    // Storage URL once the upload finishes in the background.
                    set(field.key, uri);
                    uploadFile(`workers/${draft.uid}/photo.jpg`, uri).then((url) => set(field.key, url));
                  }}
                  circular={field.circular}
                />
              );
```

Add the import at the top of the file:

```tsx
import { uploadFile } from '@/services/storage';
```

- [ ] **Step 5: Wire the same photo upload in `app/profile/edit/[section].tsx`**

Change the `photo` case (was lines 166–169):

```tsx
            case 'photo':
              return (
                <PhotoPickerField
                  key={field.key}
                  label={field.label}
                  value={value ?? null}
                  onChange={(uri) => {
                    set(field.key, uri);
                    uploadFile(`workers/${draft.uid}/photo.jpg`, uri).then((url) => set(field.key, url));
                  }}
                  circular={field.circular}
                />
              );
```

Add the import at the top of the file:

```tsx
import { uploadFile } from '@/services/storage';
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes.

- [ ] **Step 7: Manual verification (against the Firebase emulator)**

With emulators running, log in (Task 5), go to the Documents tab, upload a photo for "aadhaar" via gallery. Confirm: the upload succeeds, the doc shows as uploaded, and the Storage emulator UI (`http://localhost:4000/storage`) shows a file at `workers/{uid}/documents/aadhaar.jpg` (or the matching extension). Then in onboarding step 4 (or profile edit → personal), pick a profile photo; confirm the preview updates immediately and, a moment later, the Storage emulator UI shows `workers/{uid}/photo.jpg`, and the Firestore emulator's `workers/{uid}` doc's `photoUrl` field is a `https://` download URL (not a local `file://` URI) once the upload settles.

- [ ] **Step 8: Commit**

```bash
git add artifacts/saathi/services/storage.ts artifacts/saathi/services/documents.ts "artifacts/saathi/app/(tabs)/documents.tsx" "artifacts/saathi/app/onboarding/[step].tsx" "artifacts/saathi/app/profile/edit/[section].tsx"
git commit -m "feat(saathi): upload documents and profile photo to Firebase Storage"
```

---

## Task 7: `services/workHistory.ts`, `income.ts`, `skills.ts` → Firestore subcollections

These three files share an identical shape (list/add/delete on a per-worker subcollection, sorted client-side where applicable), so they're migrated together.

**Files:**
- Modify: `artifacts/saathi/services/workHistory.ts`
- Modify: `artifacts/saathi/services/income.ts`
- Modify: `artifacts/saathi/services/skills.ts`
- Modify: `artifacts/saathi/services/storageKeys.ts` (final trim — see Task 5 Step 4's note)

**Interfaces:**
- Consumes: `db` from `@/lib/firebase` (Task 3).
- Produces: `listWorkHistory(uid)`, `addWorkHistory(uid, input)`, `updateWorkHistory(uid, id, patch)`, `deleteWorkHistory(uid, id)`; `listIncome(uid)`, `addIncome(uid, input)`, `deleteIncome(uid, id)`; `listSkills(uid)`, `addSkill(uid, input)`, `deleteSkill(uid, id)`, `computeSkillScore(entries)` — all same signatures as today.

- [ ] **Step 1: Rewrite `services/workHistory.ts`**

Replace the whole file:

```ts
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkHistoryEntry } from '@/types/worker';

function workHistoryCollection(uid: string) {
  return collection(db, 'workers', uid, 'workHistory');
}

export async function listWorkHistory(uid: string): Promise<WorkHistoryEntry[]> {
  const snap = await getDocs(workHistoryCollection(uid));
  const entries = snap.docs.map((d) => d.data() as WorkHistoryEntry);
  return entries.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function addWorkHistory(
  uid: string,
  input: Omit<WorkHistoryEntry, 'id'>,
): Promise<WorkHistoryEntry> {
  const ref = await addDoc(workHistoryCollection(uid), input);
  const entry: WorkHistoryEntry = { ...input, id: ref.id };
  await updateDoc(ref, { id: ref.id });
  return entry;
}

export async function updateWorkHistory(
  uid: string,
  id: string,
  patch: Partial<Omit<WorkHistoryEntry, 'id'>>,
): Promise<void> {
  await updateDoc(doc(workHistoryCollection(uid), id), patch);
}

export async function deleteWorkHistory(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(workHistoryCollection(uid), id));
}
```

- [ ] **Step 2: Rewrite `services/income.ts`**

Replace the whole file:

```ts
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { IncomeEntry } from '@/types/worker';

function incomeCollection(uid: string) {
  return collection(db, 'workers', uid, 'income');
}

export async function listIncome(uid: string): Promise<IncomeEntry[]> {
  const snap = await getDocs(incomeCollection(uid));
  const entries = snap.docs.map((d) => d.data() as IncomeEntry);
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addIncome(
  uid: string,
  input: Omit<IncomeEntry, 'id'>,
): Promise<IncomeEntry> {
  const ref = await addDoc(incomeCollection(uid), input);
  await updateDoc(ref, { id: ref.id });
  return { ...input, id: ref.id };
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(incomeCollection(uid), id));
}
```

- [ ] **Step 3: Rewrite `services/skills.ts`**

Replace the whole file:

```ts
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { SkillEntry } from '@/types/worker';

function skillsCollection(uid: string) {
  return collection(db, 'workers', uid, 'skills');
}

export async function listSkills(uid: string): Promise<SkillEntry[]> {
  const snap = await getDocs(skillsCollection(uid));
  return snap.docs.map((d) => d.data() as SkillEntry);
}

export async function addSkill(
  uid: string,
  input: Omit<SkillEntry, 'id'>,
): Promise<SkillEntry> {
  const ref = await addDoc(skillsCollection(uid), input);
  await updateDoc(ref, { id: ref.id });
  return { ...input, id: ref.id };
}

export async function deleteSkill(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(skillsCollection(uid), id));
}

export function computeSkillScore(entries: SkillEntry[]): number {
  if (entries.length === 0) return 0;
  const perSkill = entries.map((s) => {
    let score = 0;
    if (s.verified) score += 40;
    score += Math.min(s.experienceYears * 5, 30);
    score += (s.rating / 5) * 20;
    if (s.trainingDone) score += 10;
    return Math.min(score, 100);
  });
  return Math.round(perSkill.reduce((a, b) => a + b, 0) / perSkill.length);
}
```

- [ ] **Step 4: Verify no remaining `storageKeys` usage outside `locale`**

```bash
grep -rn "storageKeys\." artifacts/saathi/services artifacts/saathi/app
```

Expected: the only remaining match is `app/auth/language.tsx`'s `storageKeys.locale` usage. If anything else appears, that file wasn't fully migrated in an earlier task — stop and fix it before continuing.

- [ ] **Step 5: Trim `services/storageKeys.ts`**

Replace the whole file (same content as drafted in Task 5 Step 3, now safe to land because Step 4 confirmed nothing else depends on the removed keys):

```ts
/** AsyncStorage keys still used directly by the app (locale preference only — all worker data now lives in Firestore). */
export const storageKeys = {
  locale: 'saathi:locale',
};
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes.

- [ ] **Step 7: Manual verification (against the Firebase emulator)**

Logged in, go to Income tab → add an entry → confirm it appears sorted correctly and the Firestore emulator UI shows `workers/{uid}/income/{autoId}`. Go to Skills screen → add a skill → confirm the skill score updates and the doc appears under `workers/{uid}/skills/{autoId}`. If a work-history screen is reachable in this build, add and then edit an entry, confirming the `updateWorkHistory` patch persists.

- [ ] **Step 8: Commit**

```bash
git add artifacts/saathi/services/workHistory.ts artifacts/saathi/services/income.ts artifacts/saathi/services/skills.ts artifacts/saathi/services/storageKeys.ts
git commit -m "feat(saathi): migrate workHistory/income/skills services to Firestore subcollections"
```

---

## Task 8: `services/schemes.ts`, `jobs.ts` → Firestore collections

**Files:**
- Modify: `artifacts/saathi/services/schemes.ts`
- Modify: `artifacts/saathi/services/jobs.ts`
- Modify: `artifacts/saathi/app/(tabs)/home.tsx`
- Modify: `artifacts/saathi/app/(tabs)/schemes.tsx`
- Modify: `artifacts/saathi/app/schemes/[id].tsx`

**Interfaces:**
- Consumes: `db` from `@/lib/firebase` (Task 3).
- Produces: `listSchemes(): Promise<GovtScheme[]>`, `getScheme(id): Promise<GovtScheme|null>`, `listJobs(): Promise<JobListing[]>`, `getJob(id): Promise<JobListing|null>` — same signatures as today.

- [ ] **Step 1: Rewrite `services/schemes.ts`**

Replace the whole file:

```ts
import { collection, doc, getDoc, getDocs } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { GovtScheme } from '@/types/scheme';

export async function listSchemes(): Promise<GovtScheme[]> {
  const snap = await getDocs(collection(db, 'govtSchemes'));
  return snap.docs.map((d) => d.data() as GovtScheme);
}

export async function getScheme(id: string): Promise<GovtScheme | null> {
  const snap = await getDoc(doc(db, 'govtSchemes', id));
  return snap.exists() ? (snap.data() as GovtScheme) : null;
}
```

- [ ] **Step 2: Rewrite `services/jobs.ts`**

Replace the whole file:

```ts
import { collection, doc, getDoc, getDocs } from '@react-native-firebase/firestore';
import { db } from '@/lib/firebase';
import type { JobListing } from '@/types/job';

export async function listJobs(): Promise<JobListing[]> {
  const snap = await getDocs(collection(db, 'jobs'));
  const jobs = snap.docs.map((d) => d.data() as JobListing);
  return jobs.sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function getJob(id: string): Promise<JobListing | null> {
  const snap = await getDoc(doc(db, 'jobs', id));
  return snap.exists() ? (snap.data() as JobListing) : null;
}
```

- [ ] **Step 3: Update `app/(tabs)/home.tsx` to load schemes via the service instead of the static seed import**

Change the import block (drop the `seedSchemes` import, add `listSchemes` and the `GovtScheme` type):

```tsx
import { listJobs } from '@/services/jobs';
import { listSchemes } from '@/services/schemes';
import { listIncome } from '@/services/income';
import type { GovtScheme } from '@/types/scheme';
```

Add a `schemes` state and load it alongside jobs/income:

```tsx
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!worker) return;
    const [jobList, incomeList, schemeList] = await Promise.all([
      listJobs(),
      listIncome(worker.uid),
      listSchemes(),
    ]);
    setJobs(jobList.slice(0, 3));
    setSchemes(schemeList);
    const now = new Date();
    const total = incomeList
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    setMonthTotal(total);
  }, [worker]);
```

Change the eligible-schemes line (was `const eligibleSchemes = seedSchemes.filter(...)`):

```tsx
  const eligibleSchemes = schemes.filter((s) => checkEligibility(s, worker).eligible).slice(0, 3);
```

- [ ] **Step 4: Update `app/(tabs)/schemes.tsx` to load schemes via the service**

Change the import block (drop `seedSchemes`, add `useCallback`/`useState`/`useFocusEffect`/`listSchemes`):

```tsx
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { listSchemes } from '@/services/schemes';
import { checkEligibility } from '@/utils/eligibility';
import { Badge, Card, EmptyState, LoadingState } from '@/components/ui';
import type { GovtScheme } from '@/types/scheme';
```

Change the component body (was lines 13–27):

```tsx
export default function SchemesScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listSchemes().then((list) => {
        setSchemes(list);
        setSchemesLoading(false);
      });
    }, []),
  );

  if (isLoading || !worker || schemesLoading) return <LoadingState label={t('common.loading') ?? undefined} />;

  const evaluated = schemes.map((scheme) => ({ scheme, check: checkEligibility(scheme, worker) }));
  const eligible = evaluated.filter((e) => e.check.eligible);
  const others = evaluated.filter((e) => !e.check.eligible);

  if (schemes.length === 0) {
    return <EmptyState icon="shield" title={t('schemes.emptyTitle')} />;
  }
```

- [ ] **Step 5: Update `app/schemes/[id].tsx` to load the scheme via the service**

Change the import block (drop `seedSchemes`, add `useEffect`/`useState`/`getScheme`):

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { getScheme } from '@/services/schemes';
import { checkEligibility } from '@/utils/eligibility';
import { StepHeader, Badge, Card, LoadingState, PrimaryButton, SecondaryButton } from '@/components/ui';
import type { SchemeApplicationStatus } from '@/types/worker';
import type { GovtScheme } from '@/types/scheme';
```

Change the component body (was lines 15–25):

```tsx
export default function SchemeDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { worker, isLoading, updateWorker } = useWorker();
  const showToast = useToast();
  const [scheme, setScheme] = useState<GovtScheme | null>(null);

  useEffect(() => {
    if (id) getScheme(id).then(setScheme);
  }, [id]);

  if (isLoading || !worker || !scheme) return <LoadingState label={t('common.loading') ?? undefined} />;
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes. Note this task's screens will show **empty lists** until Task 9's seed script populates `govtSchemes`/`jobs` in Firestore — that's expected at this point.

- [ ] **Step 7: Commit**

```bash
git add artifacts/saathi/services/schemes.ts artifacts/saathi/services/jobs.ts "artifacts/saathi/app/(tabs)/home.tsx" "artifacts/saathi/app/(tabs)/schemes.tsx" "artifacts/saathi/app/schemes/[id].tsx"
git commit -m "feat(saathi): load govt schemes and jobs from Firestore instead of static seed arrays"
```

---

## Task 9: `scripts/seed-firestore.ts` — one-time Admin SDK seed script

**Files:**
- Create: `artifacts/saathi/scripts/seed-firestore.ts`
- Modify: `artifacts/saathi/package.json` (add `firebase-admin` dependency + `seed:firestore` script)

**Interfaces:**
- Consumes: `seedSchemes` from `@/constants/schemes`, `seedJobs` from `@/constants/jobs` (both untouched — they remain the seed source of truth); a downloaded service account key (manual, console).
- Produces: populated `govtSchemes`/`jobs` collections in Firestore (emulator or real project, selectable via an env var).

- [ ] **Step 1: Download a service account key (manual, console)**

Firebase console → Project settings → Service accounts → "Generate new private key" → save the downloaded JSON as `artifacts/saathi/service-account.json`. Add it to `artifacts/saathi/.gitignore` immediately (this file **is** a real secret, unlike `google-services.json`):

Add to `artifacts/saathi/.gitignore`:

```
service-account.json
```

- [ ] **Step 2: Add `firebase-admin` and the seed script command**

Modify `artifacts/saathi/package.json` — add to `devDependencies`: `"firebase-admin": "^13.0.0"`, and to `scripts`:

```json
    "seed:firestore": "tsx scripts/seed-firestore.ts"
```

- [ ] **Step 3: Write `scripts/seed-firestore.ts`**

Create `artifacts/saathi/scripts/seed-firestore.ts`:

```ts
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { seedSchemes } from '../constants/schemes';
import { seedJobs } from '../constants/jobs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('../service-account.json');

const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

initializeApp(useEmulator ? {} : { credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  const batch = db.batch();

  for (const scheme of seedSchemes) {
    batch.set(db.collection('govtSchemes').doc(scheme.id), scheme);
  }
  for (const job of seedJobs) {
    batch.set(db.collection('jobs').doc(job.id), job);
  }

  await batch.commit();
  console.log(`Seeded ${seedSchemes.length} govtSchemes and ${seedJobs.length} jobs.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 4: Run the seed script against the emulator (manual verification)**

With `pnpm run emulators` running (Task 2 Step 6):

```bash
cd artifacts/saathi
USE_FIREBASE_EMULATOR=true pnpm run seed:firestore
```

Expected output: `Seeded 4 govtSchemes and 6 jobs.` (counts per the current `constants/schemes.ts`/`constants/jobs.ts` — adjust the expectation if those arrays have grown). Confirm in the Firestore emulator UI that `govtSchemes` and `jobs` collections now exist with the seeded documents.

- [ ] **Step 5: Re-run Task 8's manual verification, now with seed data present**

Reload the Home, Schemes, and Jobs screens in the dev client (still pointed at the emulator). Confirm eligible schemes and nearby jobs now render real content instead of empty lists.

- [ ] **Step 6: Run the seed script against the real project (manual)**

```bash
cd artifacts/saathi
pnpm run seed:firestore
```

Expected: same success output, now against the live Firebase project. Confirm in the Firebase console (not the emulator) that `govtSchemes`/`jobs` are populated.

- [ ] **Step 7: Run typecheck and commit**

```bash
pnpm --filter @workspace/saathi run typecheck
```

Expected: passes.

```bash
git add artifacts/saathi/scripts/seed-firestore.ts artifacts/saathi/package.json artifacts/saathi/pnpm-lock.yaml artifacts/saathi/.gitignore
git commit -m "feat(saathi): add Firestore seed script for govtSchemes and jobs"
```

---

## Task 10: End-to-end manual verification + docs update

**Files:**
- Modify: `README.md` (repo root)
- Modify: `replit.md`

**Interfaces:** none — this task only verifies the completed system and updates docs to match. No code changes beyond documentation.

- [ ] **Step 1: Full end-to-end manual run-through (against the real Firebase project, not the emulator)**

Unset `EXPO_PUBLIC_USE_FIREBASE_EMULATOR` (or set it to `false`) so the dev client talks to the real project. Using a fresh mobile number never used before:

1. Language screen → phone entry → OTP `1234` → confirm login succeeds.
2. Complete all 12 onboarding steps, including a profile photo.
3. On Home: confirm completion ring, occupation label, and (once eligible) a scheme/job render.
4. Documents tab: upload at least one document.
5. Income tab: add an income entry; confirm month total updates.
6. Skills screen (if reachable): add a skill; confirm score updates.
7. Profile tab: confirm mobile/aadhaar/pan display masked correctly, badges render if verified flags are set.
8. Sign out, then sign back in with the **same mobile number** and OTP `1234` again — confirm every piece of data from steps 2–6 is still present (this is the critical `phoneIndex`/`linkedAuthUids` regression check).

- [ ] **Step 2: Offline persistence check (Decision 6)**

With the app still on the profile/home screen from Step 1, enable Airplane Mode on the device/emulator. Confirm the already-loaded worker data still renders (no blank/error screen). Add an income entry while still offline — it should appear immediately in the list (optimistic local write). Disable Airplane Mode; within a few seconds, check the Firestore console (or emulator UI) and confirm the offline-added income entry has synced to the server. This confirms `@react-native-firebase/firestore`'s native offline persistence (on by default, no config) is actually working, not just assumed from the SDK choice.

- [ ] **Step 3: Update root `README.md`**

Add a note under the existing "Architecture decisions" section (or wherever Firebase is first mentioned) recording that Firebase (Firestore + Auth + Storage, via `@react-native-firebase/*`) replaced the AsyncStorage data layer, that a custom EAS dev client is now required (no more plain Expo Go), and link to `docs/superpowers/specs/2026-07-18-firebase-backend-design.md` for the schema.

- [ ] **Step 4: Update `replit.md`**

Update the "No Firebase yet" bullet under "Architecture decisions" to reflect that Firebase is now wired up (Firestore + Anonymous Auth + Storage, mock OTP `1234`), and update the `pnpm --filter @workspace/saathi run dev` line if the dev script changed (Task 2 Step 1 added `--dev-client`).

- [ ] **Step 5: Commit**

```bash
git add README.md replit.md
git commit -m "docs: record Firebase backend integration in README and replit.md"
```
