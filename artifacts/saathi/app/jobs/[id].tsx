import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/context/ToastContext';
import { getJob } from '@/services/jobs';
import { formatDateHi } from '@/utils/format';
import { StepHeader, Card, LoadingState, PrimaryButton } from '@/components/ui';
import type { JobListing } from '@/types/job';

export default function JobDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobListing | null | undefined>(undefined);
  const showToast = useToast();

  useEffect(() => {
    if (id) getJob(id).then(setJob);
  }, [id]);

  if (job === undefined) return <LoadingState label={t('common.loading') ?? undefined} />;
  if (job === null) return <LoadingState label={t('jobs.emptyTitle') ?? undefined} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={job.titleHi} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>
            {job.salaryPeriod === 'day' ? t('jobs.perDay', { amount: job.salary }) : t('jobs.perMonth', { amount: job.salary })}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={16} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground }}>
              {job.location.area} · {t('jobs.distance', { value: job.distanceKm })}
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: colors.foreground, marginBottom: 6 }}>{job.employerName}</Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={16} color={colors.warning} />
            <Text style={{ color: colors.mutedForeground }}>{job.employerRating.toFixed(1)} रेटिंग</Text>
          </View>
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12 }}>
            पोस्ट किया गया: {formatDateHi(job.postedAt)}
          </Text>
        </Card>

        <PrimaryButton label={t('jobs.applySoon')} onPress={() => showToast(t('jobs.applySoon'))} icon="send" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
});
