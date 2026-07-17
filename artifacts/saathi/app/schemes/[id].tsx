import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { seedSchemes } from '@/constants/schemes';
import { checkEligibility } from '@/utils/eligibility';
import { StepHeader, Badge, Card, LoadingState, PrimaryButton, SecondaryButton } from '@/components/ui';
import type { SchemeApplicationStatus } from '@/types/worker';

export default function SchemeDetailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { worker, isLoading, updateWorker } = useWorker();
  const showToast = useToast();

  const scheme = seedSchemes.find((s) => s.id === id);

  if (isLoading || !worker || !scheme) return <LoadingState label={t('common.loading') ?? undefined} />;

  const check = checkEligibility(scheme, worker);
  const status: SchemeApplicationStatus = worker.schemeApplications[scheme.id] ?? 'not_started';

  const markApplied = async () => {
    await updateWorker((draft) => ({
      ...draft,
      schemeApplications: { ...draft.schemeApplications, [scheme.id]: 'applied' },
    }));
    showToast('आवेदन स्थिति अपडेट हुई');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top }}>
        <StepHeader title={scheme.nameHi} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={[styles.iconWrap, { backgroundColor: check.eligible ? colors.successTint : colors.muted }]}>
            <Feather name={scheme.iconKey as any} size={26} color={check.eligible ? colors.success : colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: colors.foreground }}>{scheme.category}</Text>
            {check.eligible && <Badge label={t('schemes.eligible')} tone="success" />}
          </View>
        </Card>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('schemes.benefitDetail')}</Text>
          <Text style={{ color: colors.mutedForeground, lineHeight: 22 }}>{scheme.description}</Text>
        </View>

        {check.reasons.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('schemes.eligibilityChecklist')}</Text>
            <Card style={{ gap: 10 }}>
              {check.reasons.map((reason, i) => (
                <View key={i} style={styles.checkRow}>
                  <Feather
                    name={reason.pass ? 'check-circle' : 'x-circle'}
                    size={18}
                    color={reason.pass ? colors.success : colors.error}
                  />
                  <Text style={{ color: colors.foreground, flex: 1 }}>
                    {reason.label}: {reason.detail}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('schemes.documentsNeeded')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {scheme.documentsRequired.map((doc) => (
              <Badge key={doc} label={t(`documents.${doc}`)} tone="neutral" />
            ))}
          </View>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('schemes.howToApply')}</Text>
          <Card style={{ gap: 12 }}>
            {scheme.howToSteps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primaryTint }]}>
                  <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>{i + 1}</Text>
                </View>
                <Text style={{ color: colors.foreground, flex: 1 }}>{step}</Text>
              </View>
            ))}
          </Card>
        </View>

        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
          {t('schemes.applicationStatus')}: {t(`schemes.${status === 'not_started' ? 'notStarted' : status}`)}
        </Text>

        {status === 'not_started' ? (
          <PrimaryButton label={t('schemes.markApplied')} onPress={markApplied} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
