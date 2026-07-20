import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useWorker } from '@/context/WorkerContext';
import { getOccupation } from '@/constants/occupations';
import { formatDateHi } from '@/utils/format';
import { Avatar, Badge, Card, LoadingState, TextButton } from '@/components/ui';
import { UPICard } from '@/components/UPICard';

const sections: { key: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'personal', label: 'व्यक्तिगत जानकारी', icon: 'user' },
  { key: 'professional', label: 'पेशेवर जानकारी', icon: 'briefcase' },
  { key: 'financial', label: 'बैंक जानकारी', icon: 'credit-card' },
  { key: 'health', label: 'स्वास्थ्य व योजनाएँ', icon: 'heart' },
];

const SectionCard = React.memo(function SectionCard({
  section,
  colors,
}: {
  section: { key: string; label: string; icon: keyof typeof Feather.glyphMap };
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Card onPress={() => router.push(`/profile/edit/${section.key}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 }}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
        <Feather name={section.icon} size={24} color={colors.primaryDark} />
      </View>
      <Text style={{ flex: 1, fontWeight: '600', color: colors.foreground, fontSize: 16 }}>
        {section.label}
      </Text>
      <Feather name="chevron-right" size={24} color={colors.mutedForeground} />
    </Card>
  );
});

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const { signOut } = useAuth();

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 80, gap: 24 }}>
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>

        <Card style={styles.card}>
          <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={120} />
          <Text style={[styles.name, { color: colors.foreground }]}>{worker.name || 'नाम दर्ज नहीं'}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>सदस्य: {formatDateHi(worker.createdAt)} से</Text>
          {worker.occupation ? (
            <Text style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 14 }}>{getOccupation(worker.occupation)?.labelHi}</Text>
          ) : null}
          {(worker.aadhaarVerified || worker.policeVerified) && (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {worker.aadhaarVerified && <Badge label={t('profile.aadhaarVerified')} tone="success" />}
              {worker.policeVerified && <Badge label={t('profile.policeVerified')} tone="success" />}
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.cardRow}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>मोबाइल</Text>
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>+91 {worker.mobile}</Text>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={[styles.statPill, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.statValue, { color: colors.primaryDark }]}>{worker.completionPercent}%</Text>
            <Text style={{ color: colors.primaryDark, fontSize: 14 }}>प्रोफ़ाइल पूर्णता</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.successTint }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>★ {worker.rating.toFixed(1)}</Text>
            <Text style={{ color: colors.success, fontSize: 14 }}>{t('profile.rating')}</Text>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          {sections.map((section) => (
            <SectionCard key={section.key} section={section} colors={colors} />
          ))}
          <Card onPress={() => router.push('/skills')} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 20 }}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
              <Feather name="award" size={24} color={colors.primaryDark} />
            </View>
            <Text style={{ flex: 1, fontWeight: '600', color: colors.foreground, fontSize: 16 }}>
              {t('skills.title')}
            </Text>
            <Feather name="chevron-right" size={24} color={colors.mutedForeground} />
          </Card>
        </View>

        <UPICard
          upiId={`${worker.mobile}@ybl`}
          mobile={worker.mobile}
          name={worker.name}
        />

        <Card onPress={() => router.push('/upi-scanner')} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 }}>
          <View style={[styles.iconWrap, { backgroundColor: colors.successTint }]}>
            <Feather name="scan" size={24} color={colors.success} />
          </View>
          <Text style={{ flex: 1, fontWeight: '600', color: colors.foreground, fontSize: 16 }}>
            Scan UPI Payment
          </Text>
          <Feather name="chevron-right" size={24} color={colors.mutedForeground} />
        </Card>

        <View style={{ marginTop: 24, paddingBottom: 16 }}>
          <TextButton
            label="लॉग आउट करें"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginVertical: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  statPill: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
