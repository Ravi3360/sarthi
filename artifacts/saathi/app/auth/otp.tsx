import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton, TextButton } from '@/components/ui';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    const next = [...digits];
    next[index] = cleaned.slice(-1);
    setDigits(next);
    setError(null);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      submit(next.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const submit = async (code: string) => {
    if (code.length !== OTP_LENGTH || !mobile) return;
    setLoading(true);
    try {
      const success = await verifyOtp(mobile, code);
      if (!success) {
        setError(t('auth.wrongOtp'));
        setDigits(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      }
      router.replace('/');
    } catch {
      // verifyOtp throws (rather than resolving success: false) specifically
      // when linking the verified session to the worker record failed after
      // sign-in (network/server issue), as opposed to a wrong OTP. Surface a
      // distinct, retry-able error instead of letting this reject silently.
      setError(t('common.somethingWrong'));
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!mobile) return;
    await sendOtp(mobile);
    setResendTimer(30);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint }]}>
        <Feather name="lock" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('auth.enterOtp')}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {t('auth.otpSentTo', { mobile })}
      </Text>
      <View style={styles.otpRow}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.otpBox,
              { borderColor: error ? colors.error : colors.border, color: colors.foreground },
            ]}
          />
        ))}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      <Text style={[styles.mockHint, { color: colors.mutedForeground }]}>{t('auth.mockHint')}</Text>
      <View style={{ marginTop: 8 }}>
        <PrimaryButton
          label={t('auth.verify')}
          onPress={() => submit(digits.join(''))}
          loading={loading}
          disabled={digits.some((d) => !d)}
        />
      </View>
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        {resendTimer > 0 ? (
          <Text style={{ color: colors.mutedForeground }}>{t('auth.resendIn', { seconds: resendTimer })}</Text>
        ) : (
          <TextButton label={t('auth.resend')} onPress={resend} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 8,
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
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  mockHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
});
