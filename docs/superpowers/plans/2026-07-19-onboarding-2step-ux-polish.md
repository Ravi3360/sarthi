# 2-Step Onboarding + Shared UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink onboarding from 12 steps to 2 (name/gender/photo, then occupation), move every other field into the existing Profile edit sections, drop Aadhaar/PAN number entry entirely (Documents tab already covers optional photo upload), and apply icon/spacing/centering polish to the shared UI components used app-wide.

**Architecture:** All screens that render a `FieldDescriptor[]` (onboarding, profile edit) go through one new shared `FieldRenderer` component and one shared `useGpsAddressFill` hook, instead of two near-duplicate switch statements. `constants/onboardingSteps.ts` shrinks to 2 steps; the fields it used to define move into `app/profile/edit/[section].tsx`'s `sectionConfig`. Icon-size/spacing fixes land once in `components/ui.tsx` / `components/forms.tsx`.

**Tech Stack:** Expo Router, React Native, TypeScript (strict), no test runner configured — verification is `pnpm run typecheck` (must pass with zero errors) plus manual walkthroughs.

## Global Constraints

- Working directory for all commands: `/Users/himanshu/Desktop/hola/sarthi/artifacts/saathi`.
- Verification command for every task: `pnpm run typecheck` — expected output is just the two header lines (`> @workspace/saathi@0.0.0 typecheck` / `> tsc -p tsconfig.json --noEmit`), no error lines. This was confirmed as the clean baseline before this plan's changes.
- `tsconfig.json` has `strict: true` and no `noUnusedLocals`/`noUnusedParameters` — unused imports won't fail typecheck, but don't leave them anyway.
- No Firestore/data migration in this plan — `WorkerProfile.aadhaar`/`.pan` stay in the type, just unused going forward.
- All user-facing strings are Hindi, matching existing copy exactly where a field is carried over unchanged.
- Commit after every task with `git add <files> && git commit -m "..."`. Do not use `--no-verify`.

---

### Task 1: Shrink icon sizes in shared `ui.tsx` components

**Files:**
- Modify: `components/ui.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature changes — `IconTile`, `EmptyState`, `ErrorState`, `StepHeader` keep the same props; only internal sizing/spacing changes. Every later task that renders these (FieldRenderer's `occupationPicker` case, home's quick-actions grid, onboarding's `StepHeader`) automatically gets the smaller sizing.

- [ ] **Step 1: Shrink the `IconTile` icon and tile size**

In `components/ui.tsx`, find:

```tsx
      <Feather name={icon} size={36} color={selected ? colors.primaryDark : colors.foreground} />
```

Replace with:

```tsx
      <Feather name={icon} size={26} color={selected ? colors.primaryDark : colors.foreground} />
```

Then find:

```tsx
  tile: {
    width: '100%',
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
```

Replace with:

```tsx
  tile: {
    width: '100%',
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
```

- [ ] **Step 2: Shrink `EmptyState`/`ErrorState` icons and their wrap**

Find:

```tsx
      <View style={[styles.stateIconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={32} color={colors.mutedForeground} />
      </View>
```

Replace with:

```tsx
      <View style={[styles.stateIconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={26} color={colors.mutedForeground} />
      </View>
```

Find:

```tsx
        <Feather name="alert-triangle" size={32} color={colors.warning} />
```

Replace with:

```tsx
        <Feather name="alert-triangle" size={26} color={colors.warning} />
```

Find:

```tsx
  stateIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
```

Replace with:

```tsx
  stateIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
```

- [ ] **Step 3: Tighten `StepHeader` vertical padding**

Find:

```tsx
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 }}>
```

Replace with:

```tsx
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
```

- [ ] **Step 4: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 5: Commit**

```bash
git add components/ui.tsx
git commit -m "style(saathi): shrink IconTile/EmptyState/ErrorState icons, tighten StepHeader padding"
```

---

### Task 2: Center input text and shrink icon size in `FieldInput`

**Files:**
- Modify: `components/forms.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature changes to `FieldInput` or any exported component — internal styling only.

- [ ] **Step 1: Shrink the inline field icon**

In `components/forms.tsx`, find:

```tsx
        {icon && <Feather name={icon} size={20} color={colors.mutedForeground} />}
```

Replace with:

```tsx
        {icon && <Feather name={icon} size={18} color={colors.mutedForeground} />}
```

- [ ] **Step 2: Fix vertical centering of typed/placeholder text**

Find:

```tsx
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: Platform.select({ ios: 24, default: 44 }),
  },
```

Replace with:

```tsx
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: Platform.select({ ios: 24, default: 44 }),
    paddingVertical: 0,
    includeFontPadding: false,
  },
```

(`includeFontPadding: false` is Android-only and strips the default font padding that pushes typed text off-center in the input box; it's a no-op on iOS. `paddingVertical: 0` removes any inherited vertical padding so the row's `alignItems: 'center'` — already set on `inputRow` — can center the text itself.)

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 4: Commit**

```bash
git add components/forms.tsx
git commit -m "style(saathi): center FieldInput text vertically, shrink inline icon"
```

---

### Task 3: Extract the GPS reverse-geocode logic into a shared hook

**Files:**
- Create: `hooks/useGpsAddressFill.ts`

**Interfaces:**
- Consumes: `setPath` from `@/utils/objectPath`, `stateDistricts` from `@/constants/districts`, `WorkerProfile` from `@/types/worker`, `expo-location`.
- Produces: `useGpsAddressFill(setDraft: React.Dispatch<React.SetStateAction<WorkerProfile | null>>): { fillFromGps: (addressKey: string, stateKey: string, districtKey: string) => Promise<void>; locating: boolean }` — consumed by Task 6 (onboarding screen) and Task 7 (profile edit screen).

- [ ] **Step 1: Create the hook**

Create `hooks/useGpsAddressFill.ts`:

```ts
import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { stateDistricts } from '@/constants/districts';
import { setPath } from '@/utils/objectPath';
import type { WorkerProfile } from '@/types/worker';

/** English region name → Hindi state name mapping for GPS reverse-geocode */
const EN_TO_HI_STATE: Record<string, string> = {
  'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'असम',
  'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगढ़', 'Goa': 'गोवा', 'Gujarat': 'गुजरात',
  'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड',
  'Karnataka': 'कर्नाटक', 'Kerala': 'केरल', 'Madhya Pradesh': 'मध्य प्रदेश',
  'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपुर', 'Meghalaya': 'मेघालय',
  'Mizoram': 'मिज़ोरम', 'Nagaland': 'नागालैंड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब',
  'Rajasthan': 'राजस्थान', 'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिलनाडु',
  'Telangana': 'तेलंगाना', 'Tripura': 'त्रिपुरा', 'Uttar Pradesh': 'उत्तर प्रदेश',
  'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल', 'Delhi': 'दिल्ली',
  'Jammu and Kashmir': 'जम्मू और कश्मीर', 'Ladakh': 'लद्दाख',
};

/**
 * Shared GPS → address/state/district autofill, used by both the onboarding
 * wizard and Profile edit's "personal" section (both let a worker fill an
 * address via GPS instead of typing it).
 */
export function useGpsAddressFill(setDraft: React.Dispatch<React.SetStateAction<WorkerProfile | null>>) {
  const [locating, setLocating] = useState(false);

  const fillFromGps = async (addressKey: string, stateKey: string, districtKey: string) => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('अनुमति नहीं मिली', 'लोकेशन इस्तेमाल करने के लिए अनुमति दें।');
        return;
      }
      // Try cached location first (instant), fall back to fresh low-accuracy fix
      let pos = await Location.getLastKnownPositionAsync();
      if (!pos) pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (!geo) return;
      const parts = [geo.street, geo.district || geo.subregion, geo.city].filter(Boolean);
      const addressStr = parts.join(', ') + (geo.postalCode ? ' - ' + geo.postalCode : '');
      const hindiState = geo.region ? EN_TO_HI_STATE[geo.region] ?? '' : '';
      // Try to match district from Hindi district list
      const districtList = hindiState ? (stateDistricts[hindiState] ?? []) : [];
      const detectedEn = geo.district || geo.subregion || '';
      const matchedDistrict = districtList.find(
        (d) => d.toLowerCase().includes(detectedEn.toLowerCase()) || detectedEn.toLowerCase().includes(d.toLowerCase())
      ) ?? '';
      setDraft((prev) => {
        if (!prev) return prev;
        let next = setPath(prev, addressKey, addressStr);
        if (hindiState) next = setPath(next, stateKey, hindiState);
        if (matchedDistrict) next = setPath(next, districtKey, matchedDistrict);
        return next;
      });
    } catch {
      Alert.alert('त्रुटि', 'लोकेशन नहीं मिली। कृपया दोबारा कोशिश करें।');
    } finally {
      setLocating(false);
    }
  };

  return { fillFromGps, locating };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Commit**

```bash
git add hooks/useGpsAddressFill.ts
git commit -m "refactor(saathi): extract GPS address-fill into a shared hook"
```

---

### Task 4: Extract the field-type switch into a shared `FieldRenderer`

**Files:**
- Create: `components/FieldRenderer.tsx`

**Interfaces:**
- Consumes: `FieldDescriptor` from `@/constants/onboardingSteps`, `WorkerProfile` from `@/types/worker`, `getPath` from `@/utils/objectPath`, `isValidIfsc` from `@/utils/validators`, `stateDistricts` from `@/constants/districts`, `occupationGroups`/`occupations` from `@/constants/occupations`, `uploadFile` from `@/services/storage`, `IconTile` from `@/components/ui`, and `FieldInput`/`Stepper`/`ChipSelect`/`SelectField`/`DateField`/`ComboSelectField`/`BankSuggestField`/`PhotoPickerField` from `@/components/forms`.
- Produces: `FieldRenderer({ field: FieldDescriptor, draft: WorkerProfile, onChange: (key: string, value: unknown) => void, onGpsFill?: (addressKey: string, stateKey: string, districtKey: string) => void, gpsLocating?: boolean }): JSX.Element | null` — consumed by Task 6 (onboarding) and Task 7 (profile edit).

- [ ] **Step 1: Create the component**

Create `components/FieldRenderer.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { occupationGroups, occupations } from '@/constants/occupations';
import { stateDistricts } from '@/constants/districts';
import { getPath } from '@/utils/objectPath';
import { isValidIfsc } from '@/utils/validators';
import { uploadFile } from '@/services/storage';
import { IconTile } from '@/components/ui';
import {
  FieldInput,
  Stepper,
  ChipSelect,
  SelectField,
  DateField,
  ComboSelectField,
  BankSuggestField,
  PhotoPickerField,
} from '@/components/forms';
import type { FieldDescriptor } from '@/constants/onboardingSteps';
import type { WorkerProfile } from '@/types/worker';

/**
 * Renders one FieldDescriptor against a WorkerProfile draft. Shared by the
 * onboarding wizard and Profile edit sections so both stay in sync as field
 * types are added — previously each screen had its own (partially
 * duplicated) switch statement.
 */
export function FieldRenderer({
  field,
  draft,
  onChange,
  onGpsFill,
  gpsLocating,
}: {
  field: FieldDescriptor;
  draft: WorkerProfile;
  onChange: (key: string, value: unknown) => void;
  onGpsFill?: (addressKey: string, stateKey: string, districtKey: string) => void;
  gpsLocating?: boolean;
}) {
  const colors = useColors();

  if (field.type === 'locationFill') {
    return (
      <Pressable
        onPress={() => onGpsFill?.(field.addressKey, field.stateKey, field.districtKey)}
        disabled={gpsLocating}
        style={[styles.gpsButton, { borderColor: colors.primary, backgroundColor: colors.background }]}
      >
        {gpsLocating
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Feather name="map-pin" size={18} color={colors.primary} />}
        <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '600', marginLeft: 8 }}>
          {gpsLocating ? 'लोकेशन मिल रही है…' : field.label}
        </Text>
      </Pressable>
    );
  }

  const value = getPath(draft, field.key);

  switch (field.type) {
    case 'text':
      if (field.key === 'bankName') {
        return (
          <BankSuggestField
            bankName={value === null || value === undefined ? '' : String(value)}
            onBankNameChange={(text) => onChange('bankName', text)}
            onIfscSelect={(bankName, ifsc) => {
              onChange('bankName', bankName);
              onChange('ifsc', ifsc);
            }}
          />
        );
      }
      return (
        <FieldInput
          label={field.label}
          value={value === null || value === undefined ? '' : String(value)}
          onChangeText={(text) => onChange(field.key, text)}
          keyboardType={field.keyboardType}
          maxLength={field.maxLength}
          prefix={field.prefix}
          autoCapitalize={field.autoCapitalize ?? 'none'}
          error={
            field.key === 'ifsc' && value
              ? isValidIfsc(String(value))
                ? null
                : 'सही IFSC कोड डालें (जैसे SBIN0001234)'
              : null
          }
        />
      );
    case 'chips':
      return (
        <ChipSelect
          label={field.label}
          options={field.options}
          multi={field.multi}
          value={field.multi ? (Array.isArray(value) ? value : []) : value ? [value] : []}
          onChange={(vals) => onChange(field.key, field.multi ? vals : vals[0] ?? null)}
        />
      );
    case 'stepper':
      return (
        <Stepper
          label={field.label}
          value={typeof value === 'number' ? value : 0}
          onChange={(v) => onChange(field.key, v)}
          min={field.min}
          max={field.max}
        />
      );
    case 'date':
      return <DateField label={field.label} value={value ?? null} onChange={(iso) => onChange(field.key, iso)} />;
    case 'select':
      return (
        <SelectField
          label={field.label}
          value={value ?? null}
          options={field.options}
          onChange={(v) => onChange(field.key, v)}
        />
      );
    case 'comboSelect': {
      const parentVal = field.parentKey ? String(getPath(draft, field.parentKey) ?? '') : '';
      const districtOpts = parentVal
        ? (stateDistricts[parentVal] ?? []).map((d) => ({ key: d, label: d }))
        : [];
      return (
        <ComboSelectField
          label={field.label}
          value={value ?? null}
          options={districtOpts}
          onChange={(v) => onChange(field.key, v)}
          disabled={!parentVal}
        />
      );
    }
    case 'photo':
      return (
        <PhotoPickerField
          label={field.label}
          value={value ?? null}
          onChange={(uri) => {
            // Show the picked photo immediately; swap in the real
            // Storage URL once the upload finishes in the background.
            onChange(field.key, uri);
            uploadFile(`workers/${draft.uid}/photo.jpg`, uri).then((url) => onChange(field.key, url));
          }}
          circular={field.circular}
        />
      );
    case 'occupationPicker':
      return (
        <View style={{ gap: 20 }}>
          {occupationGroups.map((group) => (
            <View key={group.key} style={{ gap: 10 }}>
              <View style={styles.grid}>
                {occupations
                  .filter((o) => o.groupKey === group.key)
                  .map((occ) => (
                    <View key={occ.key} style={styles.tileWrap}>
                      <IconTile
                        icon={occ.iconKey as any}
                        label={occ.labelHi}
                        selected={value === occ.key}
                        onPress={() => onChange(field.key, occ.key)}
                      />
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileWrap: {
    width: '31%',
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Commit**

```bash
git add components/FieldRenderer.tsx
git commit -m "refactor(saathi): extract shared FieldRenderer for onboarding + profile edit"
```

---

### Task 5: Shrink onboarding to 2 steps

**Files:**
- Modify: `constants/onboardingSteps.ts`

**Interfaces:**
- Consumes: nothing (this file has no imports after this change).
- Produces: `onboardingSteps: OnboardingStep[]` (now length 2), `TOTAL_ONBOARDING_STEPS: number` (now `2`), `FieldDescriptor` (the `date` variant gains an `optional?: boolean` field, needed by Task 7's `dob` entry) — consumed by Task 6, Task 7, Task 8.

- [ ] **Step 1: Replace the whole file**

Replace the full contents of `constants/onboardingSteps.ts` with:

```ts
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
  | { type: "date"; key: string; label: string; optional?: boolean }
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
        type: "photo",
        key: "photoUrl",
        label: "अपनी फ़ोटो लगाएँ",
        circular: true,
        optional: true,
      },
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
    ],
  },
  {
    step: 2,
    title: "व्यवसाय चुनें",
    fields: [
      {
        type: "occupationPicker",
        key: "occupation",
        label: "व्यवसाय चुनें",
      },
    ],
  },
];

export const TOTAL_ONBOARDING_STEPS = onboardingSteps.length;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output. (`app/onboarding/[step].tsx` still compiles at this point — it reads `onboardingSteps`/`TOTAL_ONBOARDING_STEPS` generically over the `FieldDescriptor` union and doesn't hardcode step content, so shrinking the array to 2 steps is not a type-level change. It will, however, now render only the 2 new steps at runtime, with stale references to old step content like the Aadhaar/PAN copy still sitting in its `isValid` special-casing until Task 6 replaces the whole file.)

- [ ] **Step 3: Commit**

```bash
git add constants/onboardingSteps.ts
git commit -m "feat(saathi): shrink onboarding to 2 steps (name/gender/photo, occupation)"
```

---

### Task 6: Rewrite the onboarding step screen to use `FieldRenderer`

**Files:**
- Modify: `app/onboarding/[step].tsx`

**Interfaces:**
- Consumes: `FieldRenderer` (Task 4), `useGpsAddressFill` (Task 3), `onboardingSteps`/`TOTAL_ONBOARDING_STEPS` (Task 5), `getPath`/`setPath` from `@/utils/objectPath`, `StepHeader`/`PrimaryButton`/`LoadingState` from `@/components/ui`.
- Produces: no exported interface (route screen) — but this is what makes Task 5's `onboardingSteps` shrink actually load correctly end to end.

- [ ] **Step 1: Replace the whole file**

Replace the full contents of `app/onboarding/[step].tsx` with:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useGpsAddressFill } from '@/hooks/useGpsAddressFill';
import { onboardingSteps, TOTAL_ONBOARDING_STEPS } from '@/constants/onboardingSteps';
import { getPath, setPath } from '@/utils/objectPath';
import { StepHeader, PrimaryButton, LoadingState } from '@/components/ui';
import { FieldRenderer } from '@/components/FieldRenderer';
import type { WorkerProfile } from '@/types/worker';

export default function OnboardingStepScreen() {
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const stepNumber = Number(stepParam) || 1;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading, updateWorker } = useWorker();
  const [draft, setDraft] = useState<WorkerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const { fillFromGps, locating } = useGpsAddressFill(setDraft);

  useEffect(() => {
    if (worker) setDraft(worker);
  }, [worker?.uid]);

  useEffect(() => {
    if (!isLoading && !worker) {
      router.replace('/');
    }
  }, [isLoading, worker]);

  const config = onboardingSteps.find((s) => s.step === stepNumber);

  const isValid = useMemo(() => {
    if (!draft || !config) return false;
    return config.fields.every((field) => {
      if (field.type === 'locationFill') return true; // action button, not a data field
      if ('optional' in field && field.optional) return true;
      const value = getPath(draft, (field as any).key);
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'number') return true;
      return value !== null && value !== undefined && String(value).trim().length > 0;
    });
  }, [draft, config]);

  if (isLoading || !draft || !config) {
    return <LoadingState label="लोड हो रहा है…" />;
  }

  const set = (key: string, value: unknown) => {
    setDraft((prev) => (prev ? setPath(prev, key, value) : prev));
  };

  const goNext = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const nextStepDraft: WorkerProfile = {
        ...draft,
        lastCompletedStep: Math.max(draft.lastCompletedStep, stepNumber),
      };
      await updateWorker(() => nextStepDraft);
      if (stepNumber >= TOTAL_ONBOARDING_STEPS) {
        router.replace('/(tabs)/home');
      } else {
        router.push(`/onboarding/${stepNumber + 1}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (stepNumber <= 1) {
      router.back();
    } else {
      router.replace(`/onboarding/${stepNumber - 1}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={config.title} step={stepNumber} total={TOTAL_ONBOARDING_STEPS} onBack={goBack} />
      </View>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={40}>
        {config.fields.map((field, fieldIdx) => (
          <FieldRenderer
            key={field.type === 'locationFill' ? `loc-${fieldIdx}` : field.key}
            field={field}
            draft={draft}
            onChange={set}
            onGpsFill={fillFromGps}
            gpsLocating={locating}
          />
        ))}
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        <PrimaryButton
          label={stepNumber >= TOTAL_ONBOARDING_STEPS ? 'प्रोफ़ाइल पूरी करें' : 'आगे बढ़ें'}
          onPress={goNext}
          loading={saving}
          disabled={!isValid}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Manual check**

Start the app (`pnpm run dev` inside the Replit environment, or `pnpm exec expo start --web` for a quick local web smoke test) and, as a fresh/anonymous test user:
- Confirm onboarding shows exactly 2 pages: page 1 asks for photo (optional), name, gender; page 2 shows the occupation grid.
- Confirm page 1's "आगे बढ़ें" button stays disabled until name + gender are filled (photo optional).
- Confirm picking an occupation and tapping "प्रोफ़ाइल पूरी करें" navigates to `/(tabs)/home`.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/[step].tsx
git commit -m "refactor(saathi): rewrite onboarding step screen to use FieldRenderer"
```

---

### Task 7: Expand Profile edit sections with the deferred fields

**Files:**
- Modify: `app/profile/edit/[section].tsx`

**Interfaces:**
- Consumes: `FieldRenderer` (Task 4), `useGpsAddressFill` (Task 3), `FieldDescriptor` (Task 5), `indianStates` from `@/constants/states`, `workerLanguages` from `@/constants/languages`.
- Produces: no exported interface (route screen) — this is where every field removed from onboarding becomes reachable again.

- [ ] **Step 1: Replace the whole file**

Replace the full contents of `app/profile/edit/[section].tsx` with:

```tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { useGpsAddressFill } from '@/hooks/useGpsAddressFill';
import { indianStates } from '@/constants/states';
import { workerLanguages } from '@/constants/languages';
import { setPath } from '@/utils/objectPath';
import type { FieldDescriptor } from '@/constants/onboardingSteps';
import { StepHeader, LoadingState, PrimaryButton } from '@/components/ui';
import { FieldRenderer } from '@/components/FieldRenderer';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import type { WorkerProfile } from '@/types/worker';

const sectionConfig: Record<string, { title: string; fields: FieldDescriptor[] }> = {
  personal: {
    title: 'व्यक्तिगत जानकारी',
    fields: [
      { type: 'photo', key: 'photoUrl', label: 'फ़ोटो', circular: true, optional: true },
      { type: 'text', key: 'name', label: 'पूरा नाम', autoCapitalize: 'words' },
      {
        type: 'chips',
        key: 'gender',
        label: 'लिंग',
        options: [
          { key: 'male', label: 'पुरुष' },
          { key: 'female', label: 'महिला' },
          { key: 'other', label: 'अन्य' },
        ],
      },
      { type: 'date', key: 'dob', label: 'जन्म तिथि', optional: true },
      {
        type: 'chips',
        key: 'maritalStatus',
        label: 'वैवाहिक स्थिति',
        options: [
          { key: 'unmarried', label: 'अविवाहित' },
          { key: 'married', label: 'विवाहित' },
          { key: 'widowed', label: 'विधवा/विधुर' },
          { key: 'divorced', label: 'तलाकशुदा' },
        ],
      },
      { type: 'stepper', key: 'children', label: 'बच्चों की संख्या', min: 0, max: 15 },
      { type: 'stepper', key: 'dependents', label: 'आश्रितों की संख्या', min: 0, max: 15 },
      {
        type: 'locationFill',
        label: 'GPS से पता भरें (स्थायी)',
        addressKey: 'permanentAddress',
        stateKey: 'permanentState',
        districtKey: 'permanentDistrict',
      },
      { type: 'text', key: 'permanentAddress', label: 'स्थायी पता' },
      { type: 'select', key: 'permanentState', label: 'राज्य चुनें', options: indianStates.map((s) => ({ key: s, label: s })) },
      {
        type: 'comboSelect',
        key: 'permanentDistrict',
        label: 'जिला चुनें',
        options: [],
        parentKey: 'permanentState',
        optional: true,
      },
      {
        type: 'locationFill',
        label: 'GPS से पता भरें (वर्तमान)',
        addressKey: 'currentAddress',
        stateKey: 'currentState',
        districtKey: 'currentDistrict',
      },
      { type: 'text', key: 'currentAddress', label: 'वर्तमान पता' },
      {
        type: 'select',
        key: 'currentState',
        label: 'राज्य चुनें (वर्तमान)',
        options: indianStates.map((s) => ({ key: s, label: s })),
        optional: true,
      },
      {
        type: 'comboSelect',
        key: 'currentDistrict',
        label: 'जिला चुनें (वर्तमान)',
        options: [],
        parentKey: 'currentState',
        optional: true,
      },
      { type: 'text', key: 'nativeVillage', label: 'मूल गाँव/शहर', optional: true },
    ],
  },
  professional: {
    title: 'पेशेवर जानकारी',
    fields: [
      { type: 'occupationPicker', key: 'occupation', label: 'व्यवसाय चुनें' },
      { type: 'text', key: 'primarySkill', label: 'मुख्य कौशल' },
      { type: 'stepper', key: 'experienceYears', label: 'अनुभव (साल)', min: 0, max: 50 },
      { type: 'text', key: 'expectedSalary', label: 'अपेक्षित वेतन (₹)', keyboardType: 'numeric', prefix: '₹' },
      {
        type: 'chips',
        key: 'availability',
        label: 'उपलब्धता',
        options: [
          { key: 'full_time', label: 'फुल-टाइम' },
          { key: 'part_time', label: 'पार्ट-टाइम' },
          { key: 'on_call', label: 'ऑन-कॉल' },
        ],
      },
      {
        type: 'chips',
        key: 'education',
        label: 'शिक्षा',
        options: [
          { key: 'illiterate', label: 'निरक्षर' },
          { key: 'primary', label: 'प्राथमिक' },
          { key: 'secondary', label: 'माध्यमिक' },
          { key: 'higher_secondary', label: 'उच्चतर माध्यमिक' },
          { key: 'graduate', label: 'स्नातक+' },
        ],
      },
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
      { type: 'text', key: 'disability', label: 'दिव्यांगता (अगर कोई हो)', optional: true },
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

export default function EditSectionScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading, updateWorker } = useWorker();
  const showToast = useToast();
  const [draft, setDraft] = useState<WorkerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const { fillFromGps, locating } = useGpsAddressFill(setDraft);

  useEffect(() => {
    if (worker) setDraft(worker);
  }, [worker?.uid]);

  useEffect(() => {
    if (!isLoading && !worker) {
      router.replace('/');
    }
  }, [isLoading, worker]);

  const config = section ? sectionConfig[section] : undefined;

  if (isLoading || !draft || !config) return <LoadingState label={t('common.loading') ?? undefined} />;

  const set = (key: string, value: unknown) => {
    setDraft((prev) => (prev ? setPath(prev, key, value) : prev));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateWorker(() => draft);
      showToast(t('common.save') + ' ✓');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={config.title} onBack={() => router.back()} />
      </View>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={40}>
        {config.fields.map((field, fieldIdx) => (
          <FieldRenderer
            key={field.type === 'locationFill' ? `loc-${fieldIdx}` : field.key}
            field={field}
            draft={draft}
            onChange={set}
            onGpsFill={fillFromGps}
            gpsLocating={locating}
          />
        ))}
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        <PrimaryButton label={t('common.save')} onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Manual check**

From the Profile tab, open each of the 4 edit sections and confirm every field renders (including the two GPS-fill buttons and the occupation grid in "व्यक्तिगत जानकारी"/"पेशेवर जानकारी"), and that "Save" persists changes and returns to the Profile tab.

- [ ] **Step 4: Commit**

```bash
git add "app/profile/edit/[section].tsx"
git commit -m "feat(saathi): move deferred onboarding fields into Profile edit sections"
```

---

### Task 8: Fix the splash-gate to use the new 2-step onboarding

**Files:**
- Modify: `app/index.tsx`

**Interfaces:**
- Consumes: `TOTAL_ONBOARDING_STEPS` from `@/constants/onboardingSteps` (Task 5).
- Produces: no exported interface (route screen).

- [ ] **Step 1: Add the import**

In `app/index.tsx`, find:

```tsx
import { useWorker } from '@/context/WorkerContext';
```

Replace with:

```tsx
import { useWorker } from '@/context/WorkerContext';
import { TOTAL_ONBOARDING_STEPS } from '@/constants/onboardingSteps';
```

- [ ] **Step 2: Replace the completion-percent gate with a step-completion gate**

Find:

```tsx
    if (worker && worker.completionPercent >= 60) {
      return <Redirect href="/(tabs)/home" />;
    }
    const nextStep = worker ? Math.min(worker.lastCompletedStep + 1, 12) : 1;
    return <Redirect href={`/onboarding/${nextStep}`} />;
```

Replace with:

```tsx
    if (worker && worker.lastCompletedStep >= TOTAL_ONBOARDING_STEPS) {
      return <Redirect href="/(tabs)/home" />;
    }
    const nextStep = worker ? Math.min(worker.lastCompletedStep + 1, TOTAL_ONBOARDING_STEPS) : 1;
    return <Redirect href={`/onboarding/${nextStep}`} />;
```

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 4: Manual check**

With a worker doc that has `lastCompletedStep: 2` (or higher, from before this change, e.g. the old `12`), reload the app from the splash screen and confirm it redirects to `/(tabs)/home`, not back into onboarding.

- [ ] **Step 5: Commit**

```bash
git add app/index.tsx
git commit -m "fix(saathi): gate splash redirect on the new 2-step onboarding, not completionPercent"
```

---

### Task 9: Repoint home's "complete profile" banner to the Profile tab

**Files:**
- Modify: `app/(tabs)/home.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no exported interface (route screen).

- [ ] **Step 1: Change the banner's destination**

In `app/(tabs)/home.tsx`, find:

```tsx
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push(`/onboarding/${Math.min(worker.lastCompletedStep + 1, 12)}`)}
              >
                {t('home.completeProfile')} →
              </Text>
```

Replace with:

```tsx
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push('/(tabs)/profile')}
              >
                {t('home.completeProfile')} →
              </Text>
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/home.tsx"
git commit -m "fix(saathi): point home's complete-profile banner at the Profile tab"
```

---

### Task 10: Stop requiring `dob`/`aadhaar`/`pan` for profile completion

**Files:**
- Modify: `services/workers.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `computeCompletionPercent` (unchanged signature) now divides by 18 required checks instead of 21.

- [ ] **Step 1: Remove the three checks**

In `services/workers.ts`, find:

```ts
const REQUIRED_FIELD_CHECKS: Array<(w: WorkerProfile) => boolean> = [
  (w) => !!w.name,
  (w) => !!w.gender,
  (w) => !!w.dob,
  (w) => !!w.aadhaar,
  (w) => !!w.pan,
  (w) => !!w.maritalStatus,
```

Replace with:

```ts
const REQUIRED_FIELD_CHECKS: Array<(w: WorkerProfile) => boolean> = [
  (w) => !!w.name,
  (w) => !!w.gender,
  (w) => !!w.maritalStatus,
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output.

- [ ] **Step 3: Commit**

```bash
git add services/workers.ts
git commit -m "fix(saathi): drop dob/aadhaar/pan from required profile-completion fields"
```

---

### Task 11: Remove the now-dead Aadhaar/PAN display and helpers

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Modify: `utils/mask.ts`
- Modify: `utils/validators.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `utils/mask.ts` no longer exports `maskAadhaar`/`maskPan`; `utils/validators.ts` no longer exports `isValidAadhaar`/`isValidPan`/`aadhaarSchema`/`panSchema`. Nothing later depends on these.

- [ ] **Step 1: Remove the Aadhaar/PAN rows and their import from profile.tsx**

In `app/(tabs)/profile.tsx`, find:

```tsx
import { maskAadhaar, maskPan } from '@/utils/mask';
```

Delete that line entirely (no replacement).

Then find:

```tsx
      <Card>
        <Row label="मोबाइल" value={`+91 ${worker.mobile}`} />
        <Row label="आधार" value={worker.aadhaar ? maskAadhaar(worker.aadhaar) : '—'} />
        <Row label="पैन" value={worker.pan ? maskPan(worker.pan) : '—'} last />
      </Card>
```

Replace with:

```tsx
      <Card>
        <Row label="मोबाइल" value={`+91 ${worker.mobile}`} last />
      </Card>
```

- [ ] **Step 2: Remove `maskAadhaar`/`maskPan` from `utils/mask.ts`**

In `utils/mask.ts`, find:

```ts
export function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 12) return value;
  return `XXXX XXXX ${digits.slice(8)}`;
}

export function maskPan(value: string): string {
  const v = value.toUpperCase();
  if (v.length !== 10) return value;
  return `${v.slice(0, 2)}XXXXX${v.slice(7)}`;
}

export function maskAccountNumber(value: string): string {
```

Replace with:

```ts
export function maskAccountNumber(value: string): string {
```

- [ ] **Step 3: Remove `isValidAadhaar`/`isValidPan`/`aadhaarSchema`/`panSchema` from `utils/validators.ts`**

In `utils/validators.ts`, find:

```ts
export const aadhaarSchema = z
  .string()
  .regex(/^\d{12}$/, 'सही 12 अंकों का आधार नंबर डालें');

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'सही पैन नंबर डालें (जैसे ABCDE1234F)');

export const ifscSchema = z
```

Replace with:

```ts
export const ifscSchema = z
```

Then find:

```ts
export function isValidAadhaar(value: string): boolean {
  return aadhaarSchema.safeParse(value).success;
}

export function isValidPan(value: string): boolean {
  return panSchema.safeParse(value.toUpperCase()).success;
}

export function isValidIfsc(value: string): boolean {
```

Replace with:

```ts
export function isValidIfsc(value: string): boolean {
```

- [ ] **Step 4: Typecheck**

Run: `pnpm run typecheck`
Expected: only the two header lines, no error output — confirms nothing else referenced the removed exports.

- [ ] **Step 5: Manual check**

Open the Profile tab and confirm the info card shows only the mobile number row, with no dangling divider line below it.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/profile.tsx" utils/mask.ts utils/validators.ts
git commit -m "chore(saathi): remove dead Aadhaar/PAN display and validators"
```

---

### Task 12: Full end-to-end manual walkthrough

**Files:** none (verification only).

- [ ] **Step 1: Fresh onboarding**

Start the app, sign in as a new worker (language → phone → OTP), and confirm:
- Onboarding is exactly 2 pages (name/gender/photo, then occupation).
- Finishing lands on `/(tabs)/home`.
- The home header shows the entered name (and photo, if one was picked); completion % is low (roughly 15–25%, not near 100%).

- [ ] **Step 2: Complete the rest of the profile later**

From home, tap "प्रोफ़ाइल पूरी करें →" and confirm it opens the Profile tab (not the old onboarding wizard). Open each of the 4 sections and fill in a few fields (e.g. DOB in personal, bank details in financial). Confirm completion % on home increases after saving.

- [ ] **Step 3: Aadhaar/PAN via Documents tab**

Go to the Documents tab, upload a photo for "आधार" and "पैन" via camera or gallery, and confirm both show as uploaded. Confirm the Profile tab's info card does not show any Aadhaar/PAN rows (mobile-only card).

- [ ] **Step 4: Icon/spacing polish spot-check**

On the home tab's quick-actions grid and the onboarding/profile occupation picker, confirm tiles/icons look visibly smaller and less crowded than before. On any text field (e.g. "पूरा नाम"), confirm typed text sits vertically centered in the box, and that fields in a page read as one tight list rather than widely spaced blocks.

- [ ] **Step 5: Returning-user regression check**

If a test worker doc with the old `lastCompletedStep: 12` (or any value ≥ 2) exists, relaunch the app and confirm the splash screen sends it straight to `/(tabs)/home`, never back into onboarding.

No commit for this task — it's a verification pass. If any check fails, file it as a follow-up fix in whichever task's file owns the behavior.
