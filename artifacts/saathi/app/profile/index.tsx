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

const sections: { key: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'personal', label: 'व्यक्तिगत जानकारी', icon: 'user' },
  { key: 'professional', label: 'पेशेवर जानकारी', icon: 'briefcase' },
  { key: 'financial', label: 'बैंक जानकारी', icon: 'credit-card' },
  { key: 'health', label: 'स्वास्थ्य व योजनाएँ', icon: 'heart' },
];

// Minimalist "personal business card" style profile screen — display only
// for now (see profile.edit sections for the data-entry side). Editable
// inline editing on this card itself is a follow-up phase.
export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const { signOut } = useAuth();

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        <Card style={styles.card}>
          <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={120} />
          <Text style={[styles.name, { color: colors.foreground }]}>{worker.name || 'नाम दर्ज नहीं'}</Text>
          <Text style={{ color: colors.mutedForeground }}>सदस्य: {formatDateHi(worker.createdAt)} से</Text>
          {worker.occupation ? (
            <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>{getOccupation(worker.occupation)?.labelHi}</Text>
          ) : null}
          {(worker.aadhaarVerified || worker.policeVerified) && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {worker.aadhaarVerified && <Badge label={t('profile.aadhaarVerified')} tone="success" />}
              {worker.policeVerified && <Badge label={t('profile.policeVerified')} tone="success" />}
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.cardRow}>
            <Text style={{ color: colors.mutedForeground }}>मोबाइल</Text>
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>+91 {worker.mobile}</Text>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.statPill, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.statValue, { color: colors.primaryDark }]}>{worker.completionPercent}%</Text>
            <Text style={{ color: colors.primaryDark }}>प्रोफ़ाइल पूर्णता</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.successTint }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>★ {worker.rating.toFixed(1)}</Text>
            <Text style={{ color: colors.success }}>{t('profile.rating')}</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {sections.map((section) => (
            <Card key={section.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
                <Feather name={section.icon} size={20} color={colors.primaryDark} />
              </View>
              <Text
                style={{ flex: 1, fontWeight: '600', color: colors.foreground }}
                onPress={() => router.push(`/profile/edit/${section.key}`)}
              >
                {section.label}
              </Text>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </Card>
          ))}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
              <Feather name="award" size={20} color={colors.primaryDark} />
            </View>
            <Text style={{ flex: 1, fontWeight: '600', color: colors.foreground }} onPress={() => router.push('/skills')}>
              {t('skills.title')}
            </Text>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Card>
        </View>

        <TextButton
          label="लॉग आउट करें"
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  statPill: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
