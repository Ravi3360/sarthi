import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { onboardingSteps, TOTAL_ONBOARDING_STEPS } from '@/constants/onboardingSteps';
import { occupationGroups, occupations } from '@/constants/occupations';
import { stateDistricts } from '@/constants/districts';
import { getPath, setPath } from '@/utils/objectPath';
import { isValidAadhaar, isValidIfsc, isValidPan } from '@/utils/validators';
import { StepHeader, PrimaryButton, IconTile, LoadingState } from '@/components/ui';
import { FieldInput, Stepper, ChipSelect, SelectField, DateField, ComboSelectField, BankSuggestField } from '@/components/forms';
import { PhotoPickerField } from '@/components/forms';
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

export default function OnboardingStepScreen() {
  const { step: stepParam } = useLocalSearchParams<{ step: string }>();
  const stepNumber = Number(stepParam) || 1;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading, updateWorker } = useWorker();
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

  const config = onboardingSteps.find((s) => s.step === stepNumber);

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

  const isValid = useMemo(() => {
    if (!draft || !config) return false;
    return config.fields.every((field) => {
      if (field.type === 'locationFill') return true; // action button, not a data field
      if ('optional' in field && field.optional) return true;
      const value = getPath(draft, (field as any).key);
      if ((field as any).key === 'aadhaar') return isValidAadhaar(String(value ?? ''));
      if ((field as any).key === 'pan') return true; // optional handled above
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
        {config.fields.map((field, fieldIdx) => {
          if (field.type === 'locationFill') {
            return (
              <Pressable
                key={`loc-${fieldIdx}`}
                onPress={() => fillFromGps(field.addressKey, field.stateKey, field.districtKey)}
                disabled={locating}
                style={[styles.gpsButton, { borderColor: colors.primary, backgroundColor: colors.background }]}
              >
                {locating
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Feather name="map-pin" size={18} color={colors.primary} />}
                <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '600', marginLeft: 8 }}>
                  {locating ? 'लोकेशन मिल रही है…' : field.label}
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
                <SelectField
                  key={field.key}
                  label={field.label}
                  value={value ?? null}
                  options={field.options}
                  onChange={(v) => set(field.key, v)}
                />
              );
            case 'comboSelect': {
              const parentVal = field.parentKey ? String(getPath(draft, field.parentKey) ?? '') : '';
              const districtOpts = parentVal
                ? (stateDistricts[parentVal] ?? []).map((d) => ({ key: d, label: d }))
                : [];
              return (
                <ComboSelectField
                  key={field.key}
                  label={field.label}
                  value={value ?? null}
                  options={districtOpts}
                  onChange={(v) => set(field.key, v)}
                  disabled={!parentVal}
                />
              );
            }
            case 'photo':
              return (
                <PhotoPickerField
                  key={field.key}
                  label={field.label}
                  value={value ?? null}
                  onChange={(uri) => set(field.key, uri)}
                  circular={field.circular}
                />
              );
            case 'occupationPicker':
              return (
                <View key={field.key} style={{ gap: 20 }}>
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
                                onPress={() => set(field.key, occ.key)}
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
        })}
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
    gap: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileWrap: {
    width: '31%',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
