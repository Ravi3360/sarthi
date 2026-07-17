import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { addSkill } from '@/services/skills';
import { StepHeader, PrimaryButton } from '@/components/ui';
import { FieldInput, Stepper, ChipSelect } from '@/components/forms';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function AddSkillScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker } = useWorker();
  const showToast = useToast();
  const [name, setName] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [trainingDone, setTrainingDone] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!worker || !name) return;
    setSaving(true);
    try {
      await addSkill(worker.uid, {
        name,
        verified: false,
        experienceYears,
        certificateUrl: null,
        rating: 0,
        trainingDone: trainingDone.includes('yes'),
      });
      showToast('कौशल जोड़ा गया');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={t('skills.add')} onBack={() => router.back()} />
      </View>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={40}>
        <FieldInput label={t('skills.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <Stepper label={t('skills.experienceYears')} value={experienceYears} onChange={setExperienceYears} min={0} max={50} />
        <ChipSelect
          label={t('skills.trainingDone')}
          options={[{ key: 'yes', label: t('common.yes') }, { key: 'no', label: t('common.no') }]}
          value={trainingDone}
          onChange={setTrainingDone}
        />
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        <PrimaryButton label={t('common.save')} onPress={submit} loading={saving} disabled={!name} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
