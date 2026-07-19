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
