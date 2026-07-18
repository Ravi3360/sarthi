import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { seedSchemes } from '@/constants/schemes';
import { checkEligibility } from '@/utils/eligibility';
import { listJobs } from '@/services/jobs';
import { listIncome } from '@/services/income';
import { formatCurrency } from '@/utils/format';
import { getOccupation } from '@/constants/occupations';
import { Avatar, Card, IconTile, ProgressRing, LoadingState } from '@/components/ui';
import type { JobListing } from '@/types/job';

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!worker) return;
    const [jobList, incomeList] = await Promise.all([listJobs(), listIncome(worker.uid)]);
    setJobs(jobList.slice(0, 3));
    const now = new Date();
    const total = incomeList
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    setMonthTotal(total);
  }, [worker]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  const eligibleSchemes = seedSchemes.filter((s) => checkEligibility(s, worker).eligible).slice(0, 3);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120, paddingHorizontal: 20, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {t('home.greeting', { name: worker.name || 'साथी' })}
          </Text>
          {worker.occupation ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
              {getOccupation(worker.occupation)?.labelHi}
            </Text>
          ) : null}
        </View>
        <ProgressRing percent={worker.completionPercent} size={52} />
      </View>

      {worker.completionPercent < 100 && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                {t('profile.completion', { percent: worker.completionPercent })}
              </Text>
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push(`/onboarding/${Math.min(worker.lastCompletedStep + 1, 12)}`)}
              >
                {t('home.completeProfile')} →
              </Text>
            </View>
          </View>
        </Card>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.quickActions')}</Text>
        <View style={styles.grid}>
          <View style={styles.tileWrap}>
            <IconTile icon="upload-cloud" label={t('home.uploadDocs')} onPress={() => router.push('/(tabs)/documents')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="trending-up" label={t('home.addIncome')} onPress={() => router.push('/(tabs)/income')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="gift" label={t('home.viewSchemes')} onPress={() => router.push('/(tabs)/schemes')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="search" label={t('home.findJobs')} onPress={() => router.push('/(tabs)/income')} />
          </View>
        </View>
      </View>

      <Card style={{ backgroundColor: colors.primaryTint, borderColor: colors.primaryTint }}>
        <Text style={{ color: colors.primaryDark, fontWeight: '600', marginBottom: 4 }}>{t('home.monthEarnings')}</Text>
        <Text style={{ color: colors.primaryDark, fontSize: 28, fontWeight: '800' }}>{formatCurrency(monthTotal)}</Text>
      </Card>

      {eligibleSchemes.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.eligibleSchemes')}</Text>
          <View style={{ gap: 10 }}>
            {eligibleSchemes.map((scheme) => (
              <Card key={scheme.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.schemeIcon, { backgroundColor: colors.successTint }]}>
                  <Feather name={scheme.iconKey as any} size={20} color={colors.success} />
                </View>
                <Text
                  style={{ flex: 1, color: colors.foreground, fontWeight: '600' }}
                  onPress={() => router.push(`/schemes/${scheme.id}`)}
                >
                  {scheme.nameHi}
                </Text>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </Card>
            ))}
          </View>
        </View>
      )}

      {jobs.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.nearbyJobs')}</Text>
          <View style={{ gap: 10 }}>
            {jobs.map((job) => (
              <Card key={job.id} onTouchEnd={() => router.push(`/jobs/${job.id}`)}>
                <Text style={{ fontWeight: '700', color: colors.foreground }}>{job.titleHi}</Text>
                <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>
                  {job.location.area} · {t('jobs.distance', { value: job.distanceKm })}
                </Text>
                <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 6 }}>
                  {job.salaryPeriod === 'day'
                    ? t('jobs.perDay', { amount: job.salary })
                    : t('jobs.perMonth', { amount: job.salary })}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileWrap: {
    width: '47%',
  },
  schemeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
