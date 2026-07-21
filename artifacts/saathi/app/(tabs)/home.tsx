import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { checkEligibility } from '@/utils/eligibility';
import { listJobs } from '@/services/jobs';
import { listSchemes } from '@/services/schemes';
import { listIncome } from '@/services/income';
import { formatCurrency } from '@/utils/format';
import { getOccupation } from '@/constants/occupations';
import { Avatar, Card, IconTile, ProgressRing, LoadingState, SkeletonLoader, GradientBanner } from '@/components/ui';
import { QuickActionTile } from '@/components/QuickActionTile';
import type { JobListing } from '@/types/job';
import type { GovtScheme } from '@/types/scheme';

// Gradient pairs for scheme cards — vibrant for dark theme
const BANNER_GRADIENTS: [string, string][] = [
  ['#FF6B35', '#D32F2F'],  // Red-orange gradient
  ['#4CAF50', '#2E7D32'],  // Green gradient (for savings/schemes)
  ['#2196F3', '#1565C0'],  // Blue gradient (for government schemes)
  ['#9C27B0', '#6A1B9A'],  // Purple gradient
  ['#FF9800', '#E65100'],  // Orange gradient
];

const BANNER_CARD_WIDTH = 260;
const BANNER_GAP = 12;
const BANNER_STRIDE = BANNER_CARD_WIDTH + BANNER_GAP;
const BANNER_AUTOPLAY_MS = 2500;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading: workerLoading } = useWorker();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerIndexRef = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataLoadedRef = useRef(false);

  const startBannerAutoScroll = useCallback(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    if (schemes.length <= 1) return;
    bannerTimerRef.current = setInterval(() => {
      const next = (bannerIndexRef.current + 1) % schemes.length;
      bannerIndexRef.current = next;
      bannerScrollRef.current?.scrollTo({ x: next * BANNER_STRIDE, animated: true });
    }, BANNER_AUTOPLAY_MS);
  }, [schemes.length]);

  useEffect(() => {
    startBannerAutoScroll();
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [startBannerAutoScroll]);

  const load = useCallback(async () => {
    if (!worker) return;

    try {
      // Load critical data first (jobs + schemes) - only once per session
      if (!dataLoadedRef.current) {
        const [jobList, schemeList] = await Promise.all([
          listJobs(),
          listSchemes(),
        ]);
        setJobs(jobList.slice(0, 3));
        setSchemes(schemeList);
        dataLoadedRef.current = true;
      }

      // Always reload income to show latest data
      const incomeList = await listIncome(worker.uid);
      const now = new Date();
      const total = incomeList
        .filter((e) => {
          const d = new Date(e.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
      setMonthTotal(total);

      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load home data:', error);
      setDataLoaded(true);
    }
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

  if (workerLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;
  if (!dataLoaded && !jobs.length) return <SkeletonLoader />;

  const eligibleSchemes = useMemo(
    () => schemes.filter((s) => checkEligibility(s, worker).eligible).slice(0, 3),
    [schemes, worker]
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20, gap: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.push('/profile')}
          hitSlop={16}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
          <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={52} />
        </Pressable>
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

      {schemes.length > 0 && (
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerRow}
          onScrollBeginDrag={() => {
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
          }}
          onMomentumScrollEnd={(e) => {
            bannerIndexRef.current = Math.round(e.nativeEvent.contentOffset.x / BANNER_STRIDE);
            startBannerAutoScroll();
          }}
        >
          {schemes.map((scheme, i) => {
            const [from, to] = BANNER_GRADIENTS[i % BANNER_GRADIENTS.length];
            return (
              <Pressable key={scheme.id} onPress={() => router.push(`/schemes/${scheme.id}`)}>
                <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerCard}>
                  <View style={styles.bannerIconWrap}>
                    <Feather name={scheme.iconKey as any} size={22} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.bannerCategory}>{scheme.category}</Text>
                    <Text style={styles.bannerTitle} numberOfLines={2}>{scheme.nameHi}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {worker.completionPercent < 100 && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                {t('profile.completion', { percent: worker.completionPercent })}
              </Text>
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push('/profile')}
              >
                {t('home.completeProfile')} →
              </Text>
            </View>
          </View>
        </Card>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.quickActions')}</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionTile
            label={t('home.uploadDocs')}
            onPress={() => router.push('/documents')}
            bgGradient={['#EAF2FD', '#D8E9FB']}
            chipGradient={['#5AA0E8', '#2E6FC7']}
            labelColor="#0C447C"
            icon="upload"
          />
          <QuickActionTile
            label={t('home.addIncome')}
            onPress={() => router.push('/(tabs)/income')}
            bgGradient={['#EFF6E4', '#E0EFCC']}
            chipGradient={['#8FC44F', '#5E9520']}
            labelColor="#27500A"
            icon="coins"
          />
          <QuickActionTile
            label={t('home.viewSchemes')}
            onPress={() => router.push('/(tabs)/schemes')}
            bgGradient={['#F1F0FE', '#E2E0FA']}
            chipGradient={['#9A92EC', '#5A50C4']}
            labelColor="#3C3489"
            icon="gift"
          />
          <QuickActionTile
            label={t('home.findJobs')}
            onPress={() => router.push('/jobs')}
            bgGradient={['#FDF3E2', '#FAE6C8']}
            chipGradient={['#F2AC4A', '#D07F14']}
            labelColor="#633806"
            icon="briefcase"
          />
        </View>
      </View>

      <GradientBanner
        gradient={['#FF6B35', '#D32F2F']}
        title={t('home.monthEarnings')}
        subtitle={`${t('home.thisMonth')}: ${formatCurrency(monthTotal)}`}
        icon="trending-up"
      />

      {eligibleSchemes.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('home.eligibleSchemes')}</Text>
          <View style={{ gap: 16 }}>
            {eligibleSchemes.map((scheme, idx) => {
              const schemeGradients: [string, string][] = [
                ['#4CAF50', '#2E7D32'],  // Green
                ['#2196F3', '#1565C0'],  // Blue
                ['#9C27B0', '#6A1B9A'],  // Purple
              ];
              const gradient = schemeGradients[idx % schemeGradients.length];
              return (
                <GradientBanner
                  key={scheme.id}
                  gradient={gradient}
                  title={scheme.nameHi}
                  icon={scheme.iconKey as any}
                  onPress={() => router.push(`/schemes/${scheme.id}`)}
                />
              );
            })}
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
    gap: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-around',
    paddingHorizontal: 0,
  },
  tileWrap: {
    width: '48%',
    flexBasis: '48%',
    minWidth: 150,
  },
  schemeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRow: {
    gap: BANNER_GAP,
    paddingRight: 20,
  },
  bannerCard: {
    width: BANNER_CARD_WIDTH,
    height: 160,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCategory: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
});
