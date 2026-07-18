import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { listSchemes } from '@/services/schemes';
import { checkEligibility } from '@/utils/eligibility';
import { Badge, Card, EmptyState, LoadingState } from '@/components/ui';
import type { GovtScheme } from '@/types/scheme';

export default function SchemesScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [schemes, setSchemes] = useState<GovtScheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listSchemes().then((list) => {
        setSchemes(list);
        setSchemesLoading(false);
      });
    }, []),
  );

  if (isLoading || !worker || schemesLoading) return <LoadingState label={t('common.loading') ?? undefined} />;

  const evaluated = schemes.map((scheme) => ({ scheme, check: checkEligibility(scheme, worker) }));
  const eligible = evaluated.filter((e) => e.check.eligible);
  const others = evaluated.filter((e) => !e.check.eligible);

  if (schemes.length === 0) {
    return <EmptyState icon="shield" title={t('schemes.emptyTitle')} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 120, gap: 20 }}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>{t('schemes.title')}</Text>

      {eligible.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.success }]}>{t('schemes.eligibleTitle')}</Text>
          <View style={{ gap: 10 }}>
            {eligible.map(({ scheme }) => (
              <SchemeRow key={scheme.id} name={scheme.nameHi} desc={scheme.description} icon={scheme.iconKey} eligible onPress={() => router.push(`/schemes/${scheme.id}`)} />
            ))}
          </View>
        </View>
      )}

      {others.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('schemes.otherTitle')}</Text>
          <View style={{ gap: 10 }}>
            {others.map(({ scheme }) => (
              <SchemeRow key={scheme.id} name={scheme.nameHi} desc={scheme.description} icon={scheme.iconKey} onPress={() => router.push(`/schemes/${scheme.id}`)} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SchemeRow({
  name,
  desc,
  icon,
  eligible,
  onPress,
}: {
  name: string;
  desc: string;
  icon: string;
  eligible?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Card onTouchEnd={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={[styles.iconWrap, { backgroundColor: eligible ? colors.successTint : colors.muted }]}>
        <Feather name={icon as any} size={20} color={eligible ? colors.success : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.foreground }}>{name}</Text>
        <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
          {desc}
        </Text>
      </View>
      {eligible && <Badge label="योग्य" tone="success" />}
      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
