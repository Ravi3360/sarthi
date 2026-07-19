import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { listJobs } from '@/services/jobs';
import { Card, EmptyState, LoadingState, StepHeader } from '@/components/ui';
import type { JobListing } from '@/types/job';

export default function JobsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listJobs().then((list) => {
        setJobs(list);
        setLoading(false);
      });
    }, []),
  );

  if (loading) return <LoadingState label={t('common.loading') ?? undefined} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={t('jobs.nearby')} onBack={() => router.back()} />
      </View>
      {jobs.length === 0 ? (
        <EmptyState icon="search" title={t('jobs.emptyTitle')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
          {jobs.map((job) => (
            <Card key={job.id} onTouchEnd={() => router.push(`/jobs/${job.id}`)}>
              <Text style={{ fontWeight: '700', color: colors.foreground }}>{job.titleHi}</Text>
              <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>
                {job.employerName} · {job.location.area} · {t('jobs.distance', { value: job.distanceKm })}
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 6 }}>
                {job.salaryPeriod === 'day'
                  ? t('jobs.perDay', { amount: job.salary })
                  : t('jobs.perMonth', { amount: job.salary })}
              </Text>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
