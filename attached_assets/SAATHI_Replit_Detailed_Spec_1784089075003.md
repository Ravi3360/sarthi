# SAATHI — Detailed Replit Agent Build Spec (Full Functionality)

> Paste into the **Replit Agent**. First it should **show a plan** (files, phases, packages) — review & approve before it builds. Then build in phase order (F0 → F12), **one checkpoint per phase**, so you can review each in the web preview before continuing.

---

**THIS IS A MOBILE APP. Scaffold an Expo (React Native) + TypeScript project from the very start using `expo-router`. Configure it so `npm run web` (Expo web) serves on the Replit web preview so I can click through screens in the browser, AND so I can preview on my phone via Expo Go (QR code / tunnel). Do NOT build a plain non-Expo web app.**

---

# 0. PRODUCT OVERVIEW

**SAATHI** is a Hindi-first mobile app that gives every Indian blue-collar worker (maid, cook, guard, driver, plumber, electrician, mason, carpenter, painter, delivery worker, factory helper) a **verified digital professional identity**. Phase 1 goal: build trust and utility for the worker *before* any monetization — profile, document locker, government-scheme discovery, income tracking, work history, and job discovery.

**Audience reality (design for this):** many users have low literacy, are new to smartphones, use budget Android phones, and have unreliable data. So: big buttons, icons over text, Hindi everywhere, works offline, fast, forgiving of mistakes.

**This build = Phase 1, worker (supply) side only.** No employer side, no payments, no loans/insurance.

---

# 1. TECH STACK & SETUP

- **Expo (React Native) + TypeScript**, `expo-router` (file-based routing).
- **Firebase JS SDK v10+**: Auth (phone OTP), Firestore, Storage.
- **i18n:** `i18next` + `react-i18next`, default & only active locale `hi` (Hindi, Devanagari). English key-map kept internally for future.
- **Forms & validation:** `react-hook-form` + `zod`.
- **Media:** `expo-image-picker` (camera + gallery), `expo-document-picker` (PDF).
- **Icons:** `@expo/vector-icons`.
- **Charts:** `react-native-gifted-charts` (or `victory-native` if simpler) for the income bar chart.
- **Session storage:** `@react-native-async-storage/async-storage` for locale + resume-state.

**Replit specifics — follow these:**
- Put **all Firebase keys in Replit Secrets** (env vars, `EXPO_PUBLIC_FIREBASE_*`); read them in `src/config/firebase.ts`. Never hardcode. Add `// TODO: set in Replit Secrets` notes.
- Set up the **workflow** so the web preview runs Expo web on the correct Replit port/host (`--port` and `--host lan`/`tunnel` as needed). I want to click through the app in the Replit browser preview.
- For phone testing, expose the Expo dev server so **Expo Go** can connect (tunnel mode). Document the QR/tunnel steps.
- Use **checkpoints**: after each phase build, stop, summarize what you built, and tell me how to test it — wait for my go-ahead.
- Maintain a **`replit.md`** with the plan, phase status, decisions, and what's stubbed for Phase 2.
- Enable **Firestore offline persistence**.

**Folder structure:**
```
src/
  app/            (expo-router routes)
  components/     (reusable UI)
  theme/          (colors, spacing, typography, component tokens)
  i18n/           (hi.json, en.json, index.ts)
  config/         (firebase.ts)
  services/       (auth.ts, workers.ts, documents.ts, income.ts, schemes.ts, jobs.ts, storage.ts)
  context/        (AuthContext, WorkerContext)
  hooks/          (useWorker, useAuth, etc.)
  types/          (worker.ts, scheme.ts, job.ts)
  utils/          (validators.ts, format.ts, mask.ts, eligibility.ts)
  constants/      (occupations.ts, skills.ts, languages.ts, states.ts)
scripts/          (seed.ts)
```

---

# 2. DESIGN SYSTEM (`src/theme`) — build first, no inline hex/spacing anywhere

**Colors**
```
primary        #E31E24   // main red — CTAs, active tab, headers
primaryDark    #B71C1C
primaryTint    #FDE8E9   // light red backgrounds/badges
background     #FFFFFF
surface        #F7F7F7   // cards
textPrimary    #1A1A1A
textSecondary  #6B6B6B
textOnPrimary  #FFFFFF
border         #E5E5E5
success        #2E7D32
successTint    #E6F4EA
warning        #F9A825
error          #D32F2F
```
**Spacing scale:** 4, 8, 12, 16, 24, 32, 48.
**Radius:** sm 8, md 12 (cards), lg 16, pill 999.
**Typography** (font: Noto Sans Devanagari; load via `expo-font`):
```
display 28/700 | h1 24/700 | h2 20/700 | h3 18/600 |
body 16/400 | bodyStrong 16/600 | caption 14/400 | tiny 12/500
```
Minimum touch target 48dp. Line height generous (1.4–1.5) for Devanagari.

**Reusable components (build all, themed):**
- `PrimaryButton` (full-width red, white text, loading spinner, disabled state), `SecondaryButton` (outline), `TextButton`.
- `FieldInput` (label above, big input, error text below, optional icon), `Dropdown`/`Select` (bottom-sheet picker), `DateField`, `PhotoPickerField`, `ChipSelect` (multi-select chips).
- `IconTile` — large square (min 100x100) icon + Hindi label, used in grids (locker, quick actions, occupation picker).
- `Card`, `Chip`, `Badge` (verified/pending), `Avatar`, `ProgressRing` (circular % for profile completion), `ProgressDots` (wizard steps), `StepHeader` (back arrow + title + step count), `EmptyState` (illustration + text + CTA), `LoadingState` (skeleton/spinner), `ErrorState` (retry), `BottomSheet`, `Toast`.

Every screen must handle **3 states: loading, empty, error** — never a blank white screen.

---

# 3. i18n — HINDI COPY

All strings live in `src/i18n/hi.json`. No raw strings in JSX. Sample keys (extend as needed):
```
common: { next:"आगे बढ़ें", back:"पीछे", save:"सेव करें", skip:"अभी नहीं",
          retry:"फिर कोशिश करें", loading:"लोड हो रहा है…", upload:"अपलोड करें",
          share:"शेयर करें", download:"डाउनलोड करें", verified:"सत्यापित",
          pending:"बाकी है", edit:"बदलें", add:"जोड़ें", done:"पूरा हुआ" }
auth:   { welcome:"साथी में आपका स्वागत है", tagline:"आपकी पहचान, आपकी तरक्की",
          enterMobile:"अपना मोबाइल नंबर डालें", sendOtp:"OTP भेजें",
          enterOtp:"OTP डालें", verify:"पुष्टि करें", resend:"दोबारा भेजें" }
profile:{ completion:"प्रोफ़ाइल {{percent}}% पूरी", myProfile:"मेरी प्रोफ़ाइल" }
tabs:   { home:"होम", documents:"दस्तावेज़", schemes:"सरकारी योजना",
          income:"कमाई", profile:"प्रोफ़ाइल" }
```
Occupation, skill, and scheme names all get Hindi labels.

---

# 4. FIRESTORE DATA MODEL + TYPES

`src/types/worker.ts` (mirror exactly in Firestore):
```
workers/{uid} {
  personal: { name, gender:'male'|'female'|'other', dob(ISO), mobile, aadhaar(masked),
              pan(masked), maritalStatus, children:number, dependents:number,
              permanentAddress, currentAddress, nativeVillage, disability:boolean|string,
              photoUrl }
  professional: { occupation, primarySkill, secondarySkills:string[], experienceYears:number,
                  expectedSalary:number, currentEmployer, availability:'full_time'|'part_time'|'on_call',
                  education, languages:string[] }
  financial: { bankName, accountNoMasked, ifsc, upiId, emergencyContact }
  health: { insuranceProvider, insuranceNo, govtSchemeStatus:string[], migrationStatus:'local'|'migrant' }
  profileMeta: { completionPercent:number, verified:{policeVerified:boolean, aadhaarVerified:boolean},
                 rating:number, createdAt, updatedAt }
}
workers/{uid}/documents/{docId} { type, fileUrl, fileName, mimeType, uploadedAt, status:'uploaded'|'pending'|'verified' }
  // type: aadhaar|pan|police_verification|driving_license|certificate|experience_letter|salary_slip|health_card
workers/{uid}/workHistory/{jobId} { employer, role, location, salary:number, startDate, endDate|null, reasonForLeaving, reference }
workers/{uid}/income/{entryId} { amount:number, mode:'cash'|'upi', source:'employer'|'contractor', sourceName, date(ISO), status:'received'|'pending' }
workers/{uid}/skills/{skillId} { name, verified:boolean, experienceYears:number, certificateUrl|null, rating:number, trainingDone:boolean }

govtSchemes/{id} { name, nameHi, description, category, iconKey,
  eligibility:{ minAge|null, maxAge|null, gender:'any'|'male'|'female', occupationTags:string[],
                incomeCeiling|null, migrationRequired:boolean|null },
  documentsRequired:string[], applyUrl, howToSteps:string[] }
jobs/{id} { title, titleHi, occupationTag, salary:number, salaryPeriod:'day'|'month',
            location:{area, lat, lng}, employerName, employerRating:number, distanceKm:number, postedAt }
```

**Profile completion:** compute % from filled required fields across personal/professional/financial/documents; store in `profileMeta.completionPercent`, update on every save.

---

# 5. FIRESTORE SECURITY RULES (deliver this file)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /workers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{sub}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    match /govtSchemes/{id} { allow read: if request.auth != null; allow write: if false; }
    match /jobs/{id}       { allow read: if request.auth != null; allow write: if false; }
  }
}
```
Storage rules: files under `documents/{uid}/**` readable/writable only by that uid.

---

# 6. NAVIGATION (expo-router)

```
/ (index)  → auth gate: decides route from Firebase auth + profile state
Auth:       /auth/language  /auth/phone  /auth/otp
Onboarding: /onboarding/[step]   (12-step wizard, see F2)
Main (tabs):
  /(tabs)/home
  /(tabs)/documents
  /(tabs)/schemes        → /schemes/[id] (detail/enrollment)
  /(tabs)/income         (two sub-sections: Income + Work History)
  /(tabs)/profile        → /profile/edit/[section]
Also: /skills, /skills/add, /jobs/[id]
```
Bottom tab bar: 5 tabs, active tab red, icon + Hindi label. Header per screen white bg, back arrow where needed.

---

# 7. FEATURE SPECS (build F0 → F12 in order, one checkpoint each)

### F0 — Foundation
Scaffold Expo+TS, install packages, build the theme system + all reusable components (with a hidden `/dev/components` showcase route to eyeball them), i18n with Hindi loaded, Firebase init with offline persistence, expo-router skeleton, AuthContext + WorkerContext, and the auth gate. App should launch to a Splash then route to `/auth/language`. Confirm the Replit web preview + Expo Go tunnel both work. **Stop here (checkpoint) and let me review.**

### F1 — Authentication (phone OTP)
- **Splash**: logo + tagline (`auth.welcome`, `auth.tagline`), auto-advance after 1.5s.
- **/auth/language**: languages as big tiles; only **हिंदी** active/selectable (others disabled with "जल्द आ रहा है"). Save to AsyncStorage.
- **/auth/phone**: `+91` prefixed 10-digit input, validate (starts 6–9, 10 digits), `PrimaryButton` "OTP भेजें". Trigger Firebase phone auth (reCAPTCHA/verifier).
- **/auth/otp**: 6-box OTP input, auto-focus, 30s resend timer, verify.
- **Mock fallback (important for Replit preview):** add a `MOCK_AUTH` flag in config; when true, skip real Firebase phone auth and accept OTP `123456` for any number, creating/finding a `workers/{uid}` with a stub uid. This lets me test the whole app in the web preview without SMS setup. Default `MOCK_AUTH=true` for now.
- On success: if `workers/{uid}` exists and `completionPercent >= 60` → `/(tabs)/home`; else → `/onboarding/1`.
- Error states: invalid number, wrong OTP, network fail — all Hindi, with retry.

### F2 — Registration wizard (12 steps, MAX 4 FIELDS PER SCREEN)
`StepHeader` (back + "चरण X/12") + `ProgressDots`. **Save to Firestore after every step** so it's resumable (reopen → resume at first incomplete step). Each field: Hindi label, big input, inline validation, helper text where useful.

Steps (≤4 fields each):
1. Name, Gender (icon toggle म/स/अन्य), DOB (date picker), Mobile (prefilled, locked)
2. Aadhaar (12-digit, masked on blur, validate), PAN (10-char format, uppercase), Marital Status (dropdown), Children (stepper 0–10)
3. Dependents (stepper), Disability (yes/no + optional type), **Personal Photo** (camera/gallery, circular preview)
4. Permanent Address (multiline + State dropdown from `constants/states`)
5. Current Address (with "पक्का पते जैसा ही" copy toggle), Native Village
6. **Occupation** (icon grid picker — see occupations list), Primary Skill (depends on occupation), Secondary Skills (multi-chip), Experience (years stepper)
7. Expected Salary (₹, numeric), Current Employer (optional), Availability (full-time/part-time/on-call chips)
8. Education (dropdown: निरक्षर→स्नातक+), Languages (multi-chip: हिंदी/भोजपुरी/मैथिली/अंग्रेज़ी/…)
9. Bank Name, Account Number (masked), IFSC, UPI ID (optional but encourage)
10. Emergency Contact (name + phone)
11. Insurance (provider + number, optional), Govt Scheme Status (multi-chip of already-enrolled schemes), Migration Status (local/migrant)
12. Upload core docs: Aadhaar + PAN (camera/PDF), then a card prompting Police Verification upload ("बाद में भी कर सकते हैं")
On finish: compute completion %, route to `/(tabs)/home` with a success animation.

**Occupations (`constants/occupations.ts`)** — each with `iconKey` + Hindi label, grouped:
- घरेलू: नौकरानी/मेड, रसोइया, बेबीसिटर, केयरटेकर
- सुरक्षा: सोसाइटी गार्ड, ऑफिस गार्ड
- निर्माण: राजमिस्त्री, बढ़ई, पेंटर, इलेक्ट्रिशियन, प्लंबर
- अन्य: फैक्ट्री वर्कर, ड्राइवर, हेल्पर, डिलीवरी

### F3 — Digital Worker Profile (`/(tabs)/profile`)
Top: `ProgressRing` with completion %, Avatar, name, occupation, **verification badges** (Aadhaar ✓, Police ✓/pending), star rating. Sections as cards (Personal, Professional, Financial, Health) each with a "बदलें" button → `/profile/edit/[section]` (reuses wizard step components). Skills chips row → Skills Passport. Clean, scannable, Hindi.

### F4 — Document Locker (`/(tabs)/documents`)
Grid of `IconTile`s, one per doc type (8 types), each with a status dot (uploaded/pending/none). Tap a tile:
- Empty → upload sheet (camera / gallery / PDF via expo pickers) → upload to Storage `documents/{uid}/{type}/{filename}` → save meta → show thumbnail.
- Present → viewer (image/PDF) with **Share** and **Delete**.
Show "X/8 दस्तावेज़ अपलोड" progress. Compress images before upload. Offline: queue uploads, show pending.

### F5 — Police Verification
First-class doc type inside the locker + a dedicated card on Home if missing. Upload/download/share, **status chip** (बाकी है / सत्यापित). Phase 1 verification set manually (stub) — build UI + storage + status field; note real integration is Phase 2.

### F6 — Skills Passport (`/skills`)
List of skills: each row = name, `Badge` verified, experience, star rating, "प्रशिक्षण: हाँ/नहीं", certificate link. Header shows computed **Skill Score** (weighted: verified skills + experience + ratings + trainings, 0–100) with a `ProgressRing`. `/skills/add` to add/edit (attach certificate → Storage). Empty state encourages adding first skill.

### F7 — Government Scheme Discovery (`/(tabs)/schemes`)
Read `govtSchemes`. Run each scheme's `eligibility` against the worker profile client-side (`utils/eligibility.ts`), split into **"आप इनके लिए योग्य हैं"** and **"अन्य योजनाएँ"**. Each scheme = `Card` with iconKey, Hindi name, one-line benefit, green "योग्य" badge if eligible. Minimal text, visual. Tap → detail (F8).
**Eligibility logic:** match age range (from DOB), gender ('any' passes), `occupationTags` includes worker occupation (or empty = all), income ≤ ceiling, migration requirement. Show *why* eligible/not on detail.

### F8 — Enrollment Assistant (`/schemes/[id]`)
Scheme detail: benefit summary, **eligibility checklist** with ✓/✗ against the worker's actual data ("उम्र: ✓ 34 साल", "व्यवसाय: ✓ मेड"), **documents needed** cross-checked against the locker (✓ if uploaded, else "अपलोड करें" shortcut), **step-by-step howToSteps** (numbered, Hindi), **apply button** (opens applyUrl), and a self-updated **application status** (शुरू नहीं / आवेदन किया / मंज़ूर) saved to profile.

### F9 — Income Tracker (`/(tabs)/income`, section 1)
- **Add income** FAB → bottom sheet: amount (₹), mode (cash/UPI toggle), source (employer/contractor toggle + name), date (default today), status (मिल गया / बाकी है). Save to `income`.
- **Summary cards:** आज / इस हफ़्ते / इस महीने totals + **बकाया सैलरी** (sum of pending) highlighted in red.
- **Breakdowns:** by employer and by contractor (tappable lists).
- **Monthly bar chart** of daily/weekly income.
- Filter by month. Empty state prompts first entry. Currency formatted `₹1,23,456` (Indian grouping).

### F10 — Work History (`/(tabs)/income`, section 2 — segmented control at top)
Vertical **experience timeline** from `workHistory`: each node = employer, role, duration (auto-computed), salary, location, reason for leaving, reference. Add/Edit screen. "current" job = no end date → "अभी काम कर रहे हैं". Total experience auto-summarized at top.

### F11 — Job Discovery (on Home + `/jobs/[id]`)
Read `jobs`, show **nearby-job cards**: title (Hindi), salary (₹/day or /month), distance (X किमी), employer rating (stars). Sort by distance. Tap → detail: full info + rating; Phase 1 = **discovery only**, no apply flow ("जल्द आ रहा है" for apply). Filter by occupation.

### F12 — Home / Dashboard (`/(tabs)/home`)
Top to bottom:
- Greeting "नमस्ते, {name}" + Avatar.
- **Profile completion** `ProgressRing` card — if <100%, CTA "प्रोफ़ाइल पूरी करें".
- **Police verification** card if pending.
- **Quick actions** row of `IconTile`s: दस्तावेज़ अपलोड / कमाई जोड़ें / योजना देखें / नौकरी खोजें.
- **"आप इन योजनाओं के लिए योग्य हैं"** — horizontal scroll of top 3 qualifying schemes.
- **"आस-पास की नौकरियाँ"** — horizontal scroll of 3 nearest jobs.
- **इस महीने की कमाई** snapshot + बकाया.
Pull-to-refresh. Loading skeletons for all data.

---

# 8. SEED DATA (deliver `scripts/seed.ts`)

**govtSchemes** (real, with Hindi + eligibility):
- **Ayushman Bharat (PM-JAY)** — ₹5 lakh health cover; incomeCeiling low; occupationTags: all; docs: Aadhaar, ration/income proof.
- **PM Shram Yogi Maandhan (PM-SYM)** — pension for unorganized workers; age 18–40; incomeCeiling ₹15,000/month; docs: Aadhaar, bank, mobile.
- **e-Shram Card** — universal unorganized-worker registration; age 16–59; occupationTags: all; docs: Aadhaar, bank, mobile.
- **Skill India / PMKVY** — free skilling + certification; age 15–45; docs: Aadhaar.
- **PM Awas Yojana** — housing subsidy; incomeCeiling for EWS/LIG; docs: Aadhaar, income proof.
Each with Hindi name, benefit line, `howToSteps` (3–5 Hindi steps), `applyUrl`.

**jobs** (5–6 dummy): maid, guard, driver, electrician, delivery — with salary, area, distance, employer rating.

*(Comment: these are indicative demo eligibility rules — verify against official criteria before production.)*

---

# 9. QUALITY GUARDRAILS

- **Hindi only**, via i18n keys — no raw strings.
- **Every screen**: loading, empty, error states. Never blank.
- **Offline-first**: Firestore persistence on; registration + income entry survive no-network; queue uploads.
- **Security/privacy**: mask Aadhaar/PAN/account numbers in UI (`utils/mask.ts`), never log them, files behind per-user Storage rules; keys in Replit Secrets.
- **Validation** on every input (zod), friendly Hindi error messages.
- **Performance**: compress images before upload, paginate lists, memoize.
- **Accessibility**: min 48dp targets, large fonts, high contrast, icon+label (not icon alone).
- **Clean code**: typed Firestore services, reusable components, centralized theme, no duplication.
- **No Phase-2 scope**: no employer side, payments, loans, insurance products.

---

# 10. HOW TO PROCEED (do this on Replit)

1. **First, show me a plan** — folder structure, packages, phase breakdown, and how the web preview + Expo Go tunnel will be set up. **Wait for my approval. Don't build yet.**
2. After approval, build **F0** only, stop at a **checkpoint**, and tell me exactly how to test it (web preview URL + Expo Go steps).
3. Then build features **one phase at a time** (F1, F2, …), a checkpoint each, with a test note.
4. Keep **`MOCK_AUTH=true`** so I can test end-to-end without SMS setup; I'll flip it later.
5. Deliver the **security rules** and **seed script** at the relevant phases.
6. Put all Firebase keys in **Replit Secrets** with `EXPO_PUBLIC_FIREBASE_*` placeholders; ask me for real keys only when needed for a live test.
7. Keep **`replit.md`** updated with plan, phase status, and Phase-2 stubs.
