import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useWorker } from '@/context/WorkerContext';
import { getOccupation } from '@/constants/occupations';
import { maskAadhaar, maskPan } from '@/utils/mask';
import { Avatar, Badge, Card, LoadingState, ProgressRing, TextButton } from '@/components/ui';

const sections: { key: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'personal', label: 'व्यक्तिगत जानकारी', icon: 'user' },
  { key: 'professional', label: 'पेशेवर जानकारी', icon: 'briefcase' },
  { key: 'financial', label: 'बैंक जानकारी', icon: 'credit-card' },
  { key: 'health', label: 'स्वास्थ्य व योजनाएँ', icon: 'heart' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const { signOut } = useAuth();

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 120, gap: 20 }}
    >
      <View style={styles.headerCard}>
        <Avatar uri={worker.photoUrl} name={worker.name || '?'} size={72} />
        <Text style={[styles.name, { color: colors.foreground }]}>{worker.name || 'नाम दर्ज नहीं'}</Text>
        {worker.occupation ? (
          <Text style={{ color: colors.mutedForeground }}>{getOccupation(worker.occupation)?.labelHi}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {worker.aadhaarVerified && <Badge label={t('profile.aadhaarVerified')} tone="success" />}
          {worker.policeVerified && <Badge label={t('profile.policeVerified')} tone="success" />}
        </View>
        <View style={{ marginTop: 12 }}>
          <ProgressRing percent={worker.completionPercent} size={64} />
        </View>
      </View>

      <Card>
        <Row label="मोबाइल" value={`+91 ${worker.mobile}`} />
        <Row label="आधार" value={worker.aadhaar ? maskAadhaar(worker.aadhaar) : '—'} />
        <Row label="पैन" value={worker.pan ? maskPan(worker.pan) : '—'} last />
      </Card>

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

      <TextButton label="लॉग आउट करें" onPress={async () => { await signOut(); router.replace('/'); }} />
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.rowItem, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
      <Text style={{ color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { alignItems: 'center', gap: 4 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
});
