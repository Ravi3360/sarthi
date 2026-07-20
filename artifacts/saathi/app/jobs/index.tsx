import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { listJobs } from '@/services/jobs';
import { Card, EmptyState, LoadingState, StepHeader, SkeletonLoader, ErrorState } from '@/components/ui';
import type { JobListing } from '@/types/job';

export default function JobsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listJobs();
      setJobs(list);
    } catch (err) {
      setError(t('common.error') || 'Failed to load jobs');
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs]),
  );

  if (loading && !jobs.length) return <SkeletonLoader />;

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top }}>
          <StepHeader title={t('jobs.nearby')} onBack={() => router.back()} />
        </View>
        <ErrorState message={error} onRetry={loadJobs} />
      </View>
    );
  }

  const renderJobCard = ({ item: job }: { item: JobListing }) => (
    <Card onTouchEnd={() => router.push(`/jobs/${job.id}`)}>
      <Text style={{ fontWeight: '700', fontSize: 18, color: colors.foreground }}>{job.titleHi}</Text>
      <Text style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 14 }}>
        {job.employerName} · {job.location.area} · {t('jobs.distance', { value: job.distanceKm })}
      </Text>
      <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 8, fontSize: 18 }}>
        {job.salaryPeriod === 'day'
          ? t('jobs.perDay', { amount: job.salary })
          : t('jobs.perMonth', { amount: job.salary })}
      </Text>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={t('jobs.nearby')} onBack={() => router.back()} />
      </View>
      {jobs.length === 0 ? (
        <EmptyState icon="search" title={t('jobs.emptyTitle')} />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobCard}
          keyExtractor={(job) => job.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}
