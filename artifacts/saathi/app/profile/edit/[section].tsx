import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { indianStates } from '@/constants/states';
import { workerLanguages } from '@/constants/languages';
import { getPath, setPath } from '@/utils/objectPath';
import type { FieldDescriptor } from '@/constants/onboardingSteps';
import { StepHeader, LoadingState, PrimaryButton } from '@/components/ui';
import { FieldInput, ChipSelect, DateField, SelectField, Stepper, PhotoPickerField } from '@/components/forms';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { uploadFile } from '@/services/storage';
import type { WorkerProfile } from '@/types/worker';

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

export default function EditSectionScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading, updateWorker } = useWorker();
  const showToast = useToast();
  const [draft, setDraft] = useState<WorkerProfile | null>(null);
  const [saving, setSaving] = useState(false);

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
        {config.fields.map((field) => {
          // locationFill is an action button with no key — skip in profile edit
          if (field.type === 'locationFill') return null;
          const value = getPath(draft, field.key);
          switch (field.type) {
            case 'text':
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
                />
              );
            case 'chips':
              return (
                <ChipSelect
                  key={field.key}
                  label={field.label}
                  options={field.options}
                  multi={field.multi}
                  value={field.multi ? (Array.isArray(value) ? value : []) : value ? [value] : []}
                  onChange={(vals) => set(field.key, field.multi ? vals : vals[0] ?? null)}
                />
              );
            case 'stepper':
              return (
                <Stepper
                  key={field.key}
                  label={field.label}
                  value={typeof value === 'number' ? value : 0}
                  onChange={(v) => set(field.key, v)}
                  min={field.min}
                  max={field.max}
                />
              );
            case 'date':
              return <DateField key={field.key} label={field.label} value={value ?? null} onChange={(iso) => set(field.key, iso)} />;
            case 'select':
              return (
                <SelectField key={field.key} label={field.label} value={value ?? null} options={field.options} onChange={(v) => set(field.key, v)} />
              );
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
            default:
              return null;
          }
        })}
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        <PrimaryButton label={t('common.save')} onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
