import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { computeSkillScore, listSkills } from '@/services/skills';
import { StepHeader, Card, EmptyState, LoadingState, PrimaryButton, ProgressRing } from '@/components/ui';
import type { SkillEntry } from '@/types/worker';

export default function SkillsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [skills, setSkills] = useState<SkillEntry[]>([]);

  const load = useCallback(async () => {
    if (!worker) return;
    setSkills(await listSkills(worker.uid));
  }, [worker]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  const score = computeSkillScore(skills);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={t('skills.title')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <Card style={{ alignItems: 'center', gap: 8 }}>
          <ProgressRing percent={score} size={80} />
          <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>{t('skills.score')}</Text>
        </Card>

        <PrimaryButton label={t('skills.add')} icon="plus" onPress={() => router.push('/skills/add')} />

        {skills.length === 0 ? (
          <EmptyState icon="award" title={t('skills.emptyTitle')} subtitle={t('skills.emptySubtitle') ?? undefined} />
        ) : (
          <View style={{ gap: 10 }}>
            {skills.map((skill) => (
              <Card key={skill.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconWrap, { backgroundColor: skill.verified ? colors.successTint : colors.muted }]}>
                  <Feather name={skill.verified ? 'check-circle' : 'award'} size={20} color={skill.verified ? colors.success : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.foreground }}>{skill.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{skill.experienceYears} साल अनुभव</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
