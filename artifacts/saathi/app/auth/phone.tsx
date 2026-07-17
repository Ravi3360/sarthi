import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { isValidMobile } from '@/utils/validators';
import { FieldInput } from '@/components/forms';
import { PrimaryButton } from '@/components/ui';
import { Feather } from '@expo/vector-icons';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sendOtp } = useAuth();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isValidMobile(mobile)) {
      setError(t('auth.invalidMobile'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendOtp(mobile);
      router.push({ pathname: '/auth/otp', params: { mobile } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
        <Feather name="smartphone" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('auth.enterMobile')}</Text>
      <FieldInput
        label=""
        value={mobile}
        onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
        placeholder="98765 43210"
        keyboardType="phone-pad"
        prefix="+91"
        error={error}
        helper={!error ? t('auth.mobileHelper') ?? undefined : undefined}
      />
      <View style={{ marginTop: 8 }}>
        <PrimaryButton label={t('auth.sendOtp')} onPress={onSubmit} loading={loading} disabled={mobile.length !== 10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
});
