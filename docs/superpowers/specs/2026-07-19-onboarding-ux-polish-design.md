# Shorten Onboarding to 2 Steps + UI Polish

**Date:** 2026-07-19
**App:** `artifacts/saathi` (Expo/React Native worker app)
**Status:** Approved

## Overview

Two changes, bundled because the second only makes sense once the first is
done:

1. **Onboarding goes from 12 steps down to 2.** Today a new worker must
   clear a 12-step wizard (name, DOB, Aadhaar/PAN numbers, family info,
   photo, two addresses, occupation, skills, salary, education/languages,
   bank, emergency contact) before ever seeing the app. Instead, onboarding
   collects only the minimum needed to personalize the app and start
   matching (name, gender, optional photo, occupation), then drops the
   worker straight into the home tab. Everything else becomes fillable
   later from **Profile → edit sections**, at the worker's own pace —
   `completionPercent` will legitimately start low (roughly 20%) right
   after onboarding and grow over time. This is the intended behavior, not
   a bug.

2. **Shared-component UI polish** (icon sizes, field spacing, centered
   input text) — unchanged in substance from the original ask, still
   applied once in `components/ui.tsx` / `components/forms.tsx` so it
   benefits onboarding, profile, home, documents, schemes, and income
   screens consistently.

Aadhaar/PAN number entry is removed outright (not replaced with a new
upload UI) — the existing Documents tab (`app/(tabs)/documents.tsx`) already
lets a worker optionally upload Aadhaar/PAN **photos** via camera/gallery/PDF,
so nothing new needs to be built for that.

## Goals

1. Onboarding = 2 pages: (1) name + gender + optional photo, (2) occupation.
2. All fields dropped from onboarding remain reachable and editable from
   Profile edit sections — nothing is lost, just deferred.
3. Splash-gate and home-tab "complete profile" logic updated to match the
   new 2-step onboarding instead of the old 12-step one.
4. Smaller, consistent icons; centered input text; tighter field spacing —
   applied via shared components.

## Non-goals

- No visual redesign (colors, typography, dark mode) beyond spacing/icon sizing.
- No new upload UI for Aadhaar/PAN — Documents tab already covers it.
- No change to how `completionPercent` is computed (same required-field list,
  minus fields that no longer make sense to require — see below); the app
  already handles low/partial completion gracefully everywhere it's shown.

## Approach

### 1. Onboarding: 12 steps → 2

`constants/onboardingSteps.ts` shrinks to:

```ts
{
  step: 1,
  title: "बुनियादी जानकारी",
  fields: [
    { type: "photo", key: "photoUrl", label: "अपनी फ़ोटो लगाएँ", circular: true, optional: true },
    { type: "text", key: "name", label: "पूरा नाम", autoCapitalize: "words" },
    { type: "chips", key: "gender", label: "लिंग", options: [...] },
  ],
},
{
  step: 2,
  title: "व्यवसाय चुनें",
  fields: [{ type: "occupationPicker", key: "occupation", label: "व्यवसाय चुनें" }],
},
```

Photo is optional here (frictionless first screen); name and gender are
required; occupation stays required on step 2 (a single tap, and it's what
drives job/scheme matching on day one). `TOTAL_ONBOARDING_STEPS` becomes `2`
automatically (`onboardingSteps.length`), and `onboarding/[step].tsx`'s
existing "finish → `router.replace('/(tabs)/home')`" logic needs no change.

DOB, Aadhaar, PAN, family info, addresses, skills, salary/availability,
education/languages, bank info, and emergency contact are removed from
onboarding entirely (not deferred-with-a-flag — just gone from
`onboardingSteps`). They move into Profile edit sections (below).

### 2. Profile edit sections gain the deferred fields

`app/profile/edit/[section].tsx`'s `sectionConfig` expands so every field
that used to live in onboarding steps 3–12 has a home:

- **personal** (`व्यक्तिगत जानकारी`): adds `gender` (chips, now editable
  post-onboarding too), `maritalStatus`, `children`, `dependents`,
  `permanentDistrict`, `currentState`, `currentDistrict`, `nativeVillage`,
  and the two GPS `locationFill` buttons for permanent/current address
  (currently unsupported here — see below). `dob` stays, now `optional: true`.
- **professional** (`पेशेवर जानकारी`): adds `occupation` (`occupationPicker`,
  so it's changeable later, not just set once at onboarding), `availability`
  (chips), `education` (chips).
- **health** (`स्वास्थ्य व योजनाएँ`): adds `disability` (optional text).
- **financial** (`बैंक जानकारी`): unchanged — already has bank fields +
  emergency contact.

None of these are marked as blocking — `edit/[section].tsx` already has no
save-gating validation (unlike onboarding's `isValid`), so this is purely
additive.

### 3. Shared field rendering (needed because profile edit didn't support
   `occupationPicker` or `locationFill` before, and duplicating the full
   switch statement a second time would drift)

Extract the field-type switch currently duplicated (partially) between
`app/onboarding/[step].tsx` and `app/profile/edit/[section].tsx` into one
`components/FieldRenderer.tsx`, covering all `FieldDescriptor` cases
(`text`, `chips`, `stepper`, `date`, `select`, `comboSelect`, `photo`,
`occupationPicker`, `locationFill`). Both screens render fields via
`<FieldRenderer field={field} draft={draft} onChange={set} ... />` instead
of hand-rolled switches. This is what lets `locationFill` (GPS-fill button)
and `occupationPicker` (occupation grid) work in Profile edit without a
second copy of that logic.

The GPS reverse-geocode helper (`fillFromGps`, including the
`EN_TO_HI_STATE` map) moves into a shared `hooks/useGpsAddressFill.ts`,
since it's now called from two screens instead of one.

### 4. Splash-gate + home CTA: stop referencing the old 12-step wizard

- `app/index.tsx`: replace the hardcoded `Math.min(worker.lastCompletedStep + 1, 12)`
  with `Math.min(worker.lastCompletedStep + 1, TOTAL_ONBOARDING_STEPS)`, and
  replace the `worker.completionPercent >= 60` "am I done onboarding" check
  with `worker.lastCompletedStep >= TOTAL_ONBOARDING_STEPS`. The old
  completion-percent threshold was a proxy for "finished the old wizard";
  now that onboarding is a fixed 2 steps, checking step completion directly
  is the correct, simpler signal — a worker who finished the 2-step
  onboarding should never be routed back into it, regardless of how much of
  their (now-optional) profile they've filled in since.
- `app/(tabs)/home.tsx`: the "प्रोफ़ाइल पूरी करें →" banner (shown while
  `completionPercent < 100`) currently deep-links into
  `/onboarding/${next step}`. It changes to link to `/(tabs)/profile`, since
  the remaining fields now live in Profile edit sections, not a step wizard.

### 5. Aadhaar/PAN cleanup

- `services/workers.ts` `REQUIRED_FIELD_CHECKS`: drop `dob`, `aadhaar`,
  `pan` — none of these are captured by the new onboarding, and leaving
  them in would permanently cap completion% for every worker.
- `app/(tabs)/profile.tsx`: remove the "आधार"/"पैन" masked-value rows from
  the info card (would otherwise show "—" forever). Aadhaar/PAN status is
  visible in the Documents tab, which becomes the single source of truth.
- `utils/mask.ts` (`maskAadhaar`, `maskPan`) and `utils/validators.ts`
  (`isValidAadhaar`, `isValidPan`, `aadhaarSchema`, `panSchema`): deleted —
  no remaining callers after the above.
- `WorkerProfile.aadhaar` / `.pan` (masked-number strings) stay in the type
  for backward compatibility with any already-stored values, but nothing
  writes to them going forward.

### 6. Shared component polish (unchanged from original ask)

`components/ui.tsx`:
- `IconTile`: icon `36 → 26`, tile `minHeight 100 → 84`, tighter padding.
  Affects home quick-actions, the occupation picker (now onboarding step 2),
  and the language picker.
- `EmptyState` / `ErrorState`: icon `32 → 26`, icon wrap `72 → 60`.
- `StepHeader`: trim vertical padding slightly for a tighter header.

`components/forms.tsx` (`FieldInput` and friends):
- Vertical centering fix: explicit `paddingVertical: 0` and
  `includeFontPadding: false` (Android) on the `TextInput`, so typed text
  sits centered instead of riding on Android's default font padding.
- Tighter spacing: reduce `fieldWrap` gap and the per-screen field-list gap
  (`styles.content.gap: 20 → 14` in both onboarding and profile-edit) so
  fields read as one tight flow.
- Icon-in-field size `20 → 18` to match the smaller icon scale.

## Data model impact

No Firestore migration needed. `dob`/`aadhaar`/`pan` remain valid optional
fields on `WorkerProfile`; existing stored values (if any) are simply no
longer required or displayed as before. `lastCompletedStep` semantics change
from "0–12, gate on 12" to "0–2, gate on 2" — existing workers with
`lastCompletedStep` between 1 and 11 will read as "not yet done" and get
redirected to onboarding step `min(lastCompletedStep+1, 2)`, i.e. step 2
(occupation) or step 1, which is a reasonable one-time re-prompt given the
step content itself has changed.

## Risks / trade-offs

- Workers who already finished the old 12-step onboarding
  (`lastCompletedStep === 12`) will read as `>= TOTAL_ONBOARDING_STEPS` (now
  2) and skip straight to home — correct, they're more onboarded than the
  new bar requires.
- Workers mid-way through the old wizard (`lastCompletedStep` 1–11) get
  funneled back through the new, shorter step 1/2 — they may be asked for
  name/gender/occupation again if they'd only gotten past step 1 originally,
  but never lose already-saved data (draft always starts from the existing
  `worker` doc).
- `completionPercent` will be low (~20%) for all newly onboarded workers
  until they visit Profile edit sections — this is the explicitly desired
  behavior, not a regression.

## Testing

- Manual walk-through: fresh sign-up → onboarding shows exactly 2 pages →
  finishing page 2 lands on home tab with a low completion % and a
  "complete profile →" banner pointing at the Profile tab.
- Manual check: Profile tab's 4 sections collectively cover every field that
  used to be an onboarding step (family, addresses w/ GPS-fill, skills,
  salary/availability, education/languages, bank, emergency contact,
  disability) — nothing is unreachable.
- Manual check: occupation is editable both at onboarding and later from
  Profile → पेशेवर जानकारी.
- Manual check: a worker who already has `lastCompletedStep: 12` from before
  this change goes straight to home on next launch (no re-onboarding loop).
- `tsc --noEmit` (or the project's existing type-check script) to confirm no
  dangling references to removed exports (`maskAadhaar`, `maskPan`,
  `isValidAadhaar`, `isValidPan`) and that `FieldRenderer` covers every
  `FieldDescriptor` variant used by both screens.
