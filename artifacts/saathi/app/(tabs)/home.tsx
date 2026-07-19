import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Avatar, Card, IconTile, ProgressRing, LoadingState } from '@/components/ui';
import type { JobListing } from '@/types/job';
import type { GovtScheme } from '@/types/scheme';

// Decorative-only gradient pairs for the govt-scheme banner carousel — cycled
// by index, not tied to the design-token palette (which is deliberately
// warm-red/high-contrast for form UI, not banner variety).
const BANNER_GRADIENTS: [string, string][] = [
  ['#E31E24', '#8E1216'],
  ['#F9A825', '#B36B00'],
  ['#2E7D32', '#134E1A'],
  ['#6A3FA0', '#3E1F63'],
];

const BANNER_CARD_WIDTH = 260;
const BANNER_GAP = 12;
const BANNER_STRIDE = BANNER_CARD_WIDTH + BANNER_GAP;
const BANNER_AUTOPLAY_MS = 2500;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerIndexRef = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const [jobList, incomeList, schemeList] = await Promise.all([
      listJobs(),
      listIncome(worker.uid),
      listSchemes(),
    ]);
    setJobs(jobList.slice(0, 3));
    setSchemes(schemeList);
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

  const eligibleSchemes = schemes.filter((s) => checkEligibility(s, worker).eligible).slice(0, 3);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 140, paddingHorizontal: 20, gap: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push('/profile')} hitSlop={8}>
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
        <View style={styles.grid}>
          <View style={styles.tileWrap}>
            <IconTile icon="upload-cloud" label={t('home.uploadDocs')} onPress={() => router.push('/documents')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="trending-up" label={t('home.addIncome')} onPress={() => router.push('/(tabs)/income')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="gift" label={t('home.viewSchemes')} onPress={() => router.push('/(tabs)/schemes')} />
          </View>
          <View style={styles.tileWrap}>
            <IconTile icon="search" label={t('home.findJobs')} onPress={() => router.push('/jobs')} />
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
  bannerRow: {
    gap: BANNER_GAP,
    paddingRight: 4,
  },
  bannerCard: {
    width: BANNER_CARD_WIDTH,
    height: 150,
    borderRadius: 22,
    padding: 18,
    justifyContent: 'space-between',
  },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCategory: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
