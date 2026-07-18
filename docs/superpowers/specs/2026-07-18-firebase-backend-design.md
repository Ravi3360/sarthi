# SAATHI Firebase/Firestore backend design

Date: 2026-07-18
Status: Approved, pending implementation plan

## Context

SAATHI (`artifacts/saathi`) is currently frontend-only: all data (`WorkerProfile`, documents, work history, income, skills) lives in AsyncStorage, keyed by a mocked `uid = mock-${mobile}`. Auth is fully mocked (`services/auth.ts`: any mobile + OTP `123456` logs in). Govt schemes and jobs are static seed arrays in `constants/`, already commented as "mirroring a future Firestore collection."

Goal: replace the AsyncStorage data layer with Firebase (Firestore + Auth + Storage), no dedicated backend (no Django/MySQL yet). Schema should be simple and shaped so a later migration to a relational DB (Django/MySQL) is a straightforward mapping, not a redesign. Mock OTP changes from `123456` to `1234` — still no real SMS integration.

No changes to `artifacts/api-server` or `lib/db` — they remain unused by SAATHI, as today.

## Decisions

1. **SDK**: `@react-native-firebase/*` (native modules: `app`, `auth`, `firestore`, `storage`). **Revised from the originally approved Firebase JS SDK** — during plan-writing it was confirmed that the JS SDK's Firestore offline persistence (`persistentLocalCache`) is IndexedDB-based and does not work on React Native (only in browsers); real Firestore offline caching on RN only exists in the native SDK. Since offline support (Decision 6) matters more than keeping plain Expo Go, this trade is accepted:
   - **Dev workflow changes**: plain `expo start` + Expo Go app no longer works once native Firebase modules are linked. Requires `expo-dev-client` + a custom dev client build, produced via **EAS Build** (`eas build --profile development`).
   - **App identifier**: `com.saathi.app` set as both `ios.bundleIdentifier` and `android.package` in `app.json` (previously unset) — required to register native apps in the Firebase console and for the dev client build.
   - Firestore offline persistence is native and **on by default** for `@react-native-firebase/firestore` — no extra persistence config needed (unlike the JS SDK, which needed explicit and RN-incompatible cache setup).
   - API shape is the namespaced RNFirebase style (`auth().signInAnonymously()`, `firestore().collection(...).doc(...)`, `storage().ref(...)`), not the modular `firebase/*` functional API — referenced as such in the service-layer section below.

2. **Auth**: Firebase Anonymous Authentication under a mock OTP gate.
   - `sendOtp` unchanged in shape (simulated delay, no real SMS).
   - `verifyOtp(mobile, otp)`: accepts any 10-digit mobile if `otp === '1234'`.
   - On success: look up `phoneIndex/{mobile}` for an existing `uid`. If found, sign in anonymously (new anon session) and treat the **looked-up** uid as the worker id (not `auth.currentUser.uid`) — array-union the new anon uid into that worker doc's `linkedAuthUids`. If not found, sign in anonymously, use the fresh anon uid as the worker id, create `phoneIndex/{mobile} = { uid }` and `workers/{uid}` with `linkedAuthUids: [uid]`.
   - Rationale: plain anonymous-auth uids are not stable across sign-out/reinstall, which would silently break today's "same mobile always returns the same data" behavior. The `phoneIndex` lookup + `linkedAuthUids` array preserves it.
   - `signOut()` calls Firebase `signOut(auth)`.

3. **Firestore schema** — flat `workers/{uid}` doc (no nested `personal`/`professional`/`financial`/`health` sub-maps) + 4 subcollections, so each maps 1:1 to a future SQL table:

   ```
   phoneIndex/{mobile}                 # doc id = mobile number
     uid: string

   workers/{uid}
     mobile: string
     name: string
     gender: 'male'|'female'|'other'|null
     dob: string|null                  # ISO date
     aadhaar: string                   # masked
     pan: string                       # masked
     maritalStatus: 'unmarried'|'married'|'widowed'|'divorced'|null
     children: number
     dependents: number
     permanentAddress, permanentState, permanentDistrict: string
     currentAddress, currentState, currentDistrict: string
     nativeVillage: string
     disability: string
     photoUrl: string|null             # Firebase Storage download URL
     occupation, primarySkill: string
     secondarySkills: string[]
     experienceYears: number
     expectedSalary: number|null
     currentEmployer: string
     availability: 'full_time'|'part_time'|'on_call'|null
     education: 'illiterate'|'primary'|'secondary'|'higher_secondary'|'graduate'|null
     languages: string[]
     bankName, accountNoMasked, ifsc, upiId: string
     emergencyContactName, emergencyContactPhone: string
     insuranceProvider, insuranceNo: string
     govtSchemeStatus: string[]
     migrationStatus: 'local'|'migrant'|null
     policeVerified, aadhaarVerified: boolean
     rating: number
     completionPercent: number
     lastCompletedStep: number
     schemeApplications: map<schemeId, 'not_started'|'applied'|'approved'>
     linkedAuthUids: string[]          # anon-auth uids authorized to access this doc
     createdAt, updatedAt: Timestamp

   workers/{uid}/documents/{docId}     # docId = DocumentType (one per type, matches today's upsert-by-type)
     type, fileUrl, fileName, mimeType, status, uploadedAt

   workers/{uid}/workHistory/{id}
     employer, role, location, salary, startDate, endDate, reasonForLeaving, reference

   workers/{uid}/income/{id}
     amount, mode, source, sourceName, date, status

   workers/{uid}/skills/{id}
     name, verified, experienceYears, certificateUrl, rating, trainingDone

   govtSchemes/{id}                    # seeded from constants/schemes.ts, same shape as GovtScheme
     name, nameHi, description, category, iconKey, eligibility{...}, documentsRequired, applyUrl, howToSteps

   jobs/{id}                           # seeded from constants/jobs.ts, same shape as JobListing
     title, titleHi, occupationTag, salary, salaryPeriod, location{area,lat,lng}, employerName, employerRating, distanceKm, postedAt
   ```

   `schemeApplications` is the one field that won't flatten trivially into a relational migration — it becomes its own join table (`worker_id`, `scheme_id`, `status`) later. Noted, not solved now.

4. **Seed data**: `govtSchemes` and `jobs` move into real Firestore collections now (not deferred). A one-time seed script (`scripts/seed-firestore.ts`) reads the existing `constants/schemes.ts`/`constants/jobs.ts` arrays and writes them via the Firebase Admin SDK. Those constants files stay in the repo as the seed source of truth; `services/schemes.ts`/`services/jobs.ts` switch from reading the local array to reading the Firestore collection.

5. **File storage**: Firebase Storage, wired up now (not deferred).
   ```
   /workers/{uid}/photo.jpg
   /workers/{uid}/documents/{docType}.{ext}
   ```
   Upload replaces any existing file at that path (matches today's one-file-per-type upsert semantics). After upload, the resulting download URL is written into the corresponding Firestore field (`photoUrl`, or the subcollection doc's `fileUrl`).

6. **Offline persistence**: enabled, and free — `@react-native-firebase/firestore`'s native offline persistence is on by default (no config needed, per revised Decision 1), so the app can read/write while offline and sync when back online — matches today's fully-offline UX and fits the target users' (blue-collar workers) patchy connectivity.

7. **Security rules** (core logic; test-mode-grade, not production-hardened):
   ```
   match /phoneIndex/{mobile} {
     allow read: if true;   // contains only a uid pointer, no sensitive data on its own
     allow write: if false; // written only via trusted client logic on first-ever signup
   }
   match /workers/{uid} {
     allow read, write: if request.auth != null
       && (request.auth.uid == uid || request.auth.uid in resource.data.linkedAuthUids);
     match /{subcollection}/{docId} {
       allow read, write: if request.auth != null
         && request.auth.uid in get(/databases/$(database)/documents/workers/$(uid)).data.linkedAuthUids;
     }
   }
   match /govtSchemes/{id} { allow read: if true; allow write: if false; }
   match /jobs/{id}        { allow read: if true; allow write: if false; }
   ```
   Storage rules mirror this via a Firestore `get()` check on `linkedAuthUids` for paths under `/workers/{uid}/**`.

   Known caveat: `phoneIndex` open-read lets anyone enumerate `uid` for a known mobile number. Low sensitivity on its own (a bare uid grants nothing unless also present in `linkedAuthUids`), but flagged as a rule to harden once a real backend/auth layer exists.

8. **Firebase project**: does not exist yet. Implementation plan must include console setup steps: create project, register **native** iOS + Android apps under app id `com.saathi.app` (downloading `GoogleService-Info.plist` / `google-services.json`, referenced from `app.json`), enable Firestore + Anonymous Auth + Storage. No web app registration needed (native SDK, not the JS SDK).

9. **Native build tooling**: EAS Build. `expo-dev-client` added as a dependency; `eas.json` gets a `development` build profile; developers run `eas build --profile development` once (and after any native dependency change) to produce an installable dev client, then `expo start --dev-client` for the normal iterate loop. Plain Expo Go no longer works for this app once native Firebase modules are linked.

## Service-layer changes

Per the existing invariant already stated in `replit.md` ("swapping in real Firebase later only touches the `services/` layer"):

- `lib/firebase.ts` (new) — thin re-export of the RNFirebase default instances (`@react-native-firebase/app`, `auth`, `firestore`, `storage`); native config comes from the platform `GoogleService-Info.plist`/`google-services.json` files (auto-picked-up by the native SDK), not JS-side env vars.
- `services/auth.ts` — rewritten internals per Decision 2, using `auth().signInAnonymously()` / `auth().signOut()` / `auth().onAuthStateChanged()`; same exported function signatures as today.
- `services/workers.ts`, `documents.ts`, `income.ts`, `workHistory.ts`, `skills.ts` — internals swapped from AsyncStorage calls to Firestore (`firestore().collection(...).doc(...).get()/.set()/.update()`, subcollection CRUD); same exported function signatures, so **no changes required in `app/*` screens or `context/*`**.
- `services/documents.ts` — adds Storage upload step (`storage().ref(path).putFile(uri)` → `.getDownloadURL()` → write Firestore doc).
- `services/schemes.ts`, `services/jobs.ts` — switch from reading local seed arrays to reading their Firestore collections.
- `scripts/seed-firestore.ts` (new) — one-time **Admin SDK** (`firebase-admin`, plain Node.js via `tsx`, unaffected by the client-SDK choice above) seed script.
- `firestore.rules`, `storage.rules` (new, inside `artifacts/saathi/`) — deployed via Firebase CLI (`firebase deploy --only firestore:rules,storage:rules`).
- `types/worker.ts` — `WorkerProfile` flattened (Decision 3). This is the one change that ripples beyond the services layer: every screen currently reading `worker.personal.name`-style nested paths (the 12 onboarding steps + profile/edit screens) needs updating to the flat field names. This is the largest code-churn item in the plan.

## Migration-to-relational mapping (documented for later, not built now)

- `workers/{uid}` → `Worker` table, one row per uid. `linkedAuthUids` dropped (Firebase-auth-specific, replaced by Django's own session/auth). `schemeApplications` becomes a `WorkerSchemeApplication` join table (`worker_id`, `scheme_id`, `status`).
- Each subcollection (`documents`, `workHistory`, `income`, `skills`) → its own table with a `worker_id` foreign key.
- `govtSchemes`, `jobs` → their own tables, direct field mapping.

## Testing

Firebase local Emulator Suite (Firestore + Auth + Storage) for development — no live project needed while iterating; app points at emulator hosts via an env flag. Manual end-to-end check: OTP login (mobile + `1234`) → onboarding → document upload → income/skills entries → sign out → sign back in with same mobile → confirm data reappears (validates the `phoneIndex`/`linkedAuthUids` re-login path).

## Explicitly out of scope this round

- Real SMS/phone-number verification (OTP stays hardcoded `1234`).
- `artifacts/api-server` / `lib/db` integration — untouched.
- Production-hardened security rules (the `phoneIndex` open-read caveat is accepted for now).
- Admin/employer-facing features.

## Future migration note: real Phone Auth supersedes Decisions 2 & 7

The `phoneIndex` lookup table and `linkedAuthUids` array (Decisions 2 and 7) exist **only** to work around anonymous-auth uids not being stable across sign-out/reinstall. Once real Firebase Phone Auth (actual SMS OTP) replaces the mock `1234` gate, this entire workaround is dropped, not carried forward:

- Firebase Phone Auth issues a `uid` tied directly and permanently to the verified phone number — same number always resolves to the same `uid`, server-side, with no app-managed lookup table needed.
- Delete the `phoneIndex` collection and the `linkedAuthUids` field entirely.
- Security rules collapse to the standard form: `allow read, write: if request.auth.uid == uid` (no `resource.data.linkedAuthUids` check, no separate subcollection `get()` lookup).
- `services/auth.ts` simplifies to just reading `auth.currentUser.uid` directly after Phone Auth completes — no lookup-then-swap-uid step.
- The `mobile` field stays on `workers/{uid}` (useful for display/support), it just stops being used as a join key.

This is the trigger condition for a follow-up spec, not something to build speculatively now.
