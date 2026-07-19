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
