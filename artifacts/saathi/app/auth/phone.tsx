import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { isValidMobile } from '@/utils/validators';
import { FieldInput } from '@/components/forms';
import { PrimaryButton, TextButton } from '@/components/ui';
import { Feather } from '@expo/vector-icons';

const OTP_LENGTH = 4; // Changed from 6 to 4 digits

export default function PhoneScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useAuth();

  // Phone input state
  const [mobile, setMobile] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSending, setPhoneSending] = useState(false);

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const onPhoneSubmit = async () => {
    if (!isValidMobile(mobile)) {
      setPhoneError(t('auth.invalidMobile'));
      return;
    }
    setPhoneError(null);
    setPhoneSending(true);
    try {
      await sendOtp(mobile);
      setShowOtpModal(true);
      setResendTimer(30);
      setTimeout(() => inputs.current[0]?.focus(), 300);
    } finally {
      setPhoneSending(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    const next = [...digits];
    next[index] = cleaned.slice(-1);
    setDigits(next);
    setOtpError(null);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      submitOtp(next.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    if (code.length !== OTP_LENGTH || !mobile) return;
    setOtpLoading(true);
    try {
      const success = await verifyOtp(mobile, code);
      if (!success) {
        setOtpError(t('auth.wrongOtp'));
        setDigits(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      }
      router.replace('/');
    } catch {
      setOtpError(t('common.somethingWrong'));
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const resend = async () => {
    if (!mobile) return;
    await sendOtp(mobile);
    setResendTimer(30);
    setDigits(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setDigits(Array(OTP_LENGTH).fill(''));
    setOtpError(null);
    setMobile('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      {/* Phone Input Section */}
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
        error={phoneError}
        helper={!phoneError ? t('auth.mobileHelper') ?? undefined : undefined}
      />
      <View style={{ marginTop: 8 }}>
        <PrimaryButton
          label={t('auth.sendOtp')}
          onPress={onPhoneSubmit}
          loading={phoneSending}
          disabled={mobile.length !== 10 || showOtpModal}
        />
      </View>

      {/* OTP Modal Popup */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={closeOtpModal}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={closeOtpModal}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={() => {}} // Prevent closing when tapping inside modal
          >
            <View style={{ alignItems: 'center', gap: 12 }}>
              {/* Close Button */}
              <Pressable
                onPress={closeOtpModal}
                style={{ alignSelf: 'flex-end', padding: 8 }}
                hitSlop={12}
              >
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>

              {/* OTP Title */}
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t('auth.enterOtp')}
              </Text>

              {/* OTP Subtitle */}
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                {t('auth.otpSentTo', { mobile })}
              </Text>

              {/* OTP Input Row - Small Size */}
              <View style={styles.otpRow}>
                {digits.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, i)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={[
                      styles.otpBox,
                      { borderColor: otpError ? colors.error : colors.border, color: colors.foreground },
                    ]}
                  />
                ))}
              </View>

              {/* Error Message */}
              {otpError && (
                <Text style={[styles.error, { color: colors.error }]}>{otpError}</Text>
              )}

              {/* Mock Hint */}
              <Text style={[styles.mockHint, { color: colors.mutedForeground }]}>
                {t('auth.mockHint')}
              </Text>

              {/* Verify Button */}
              <View style={{ width: '100%', marginTop: 8 }}>
                <PrimaryButton
                  label={t('auth.verify')}
                  onPress={() => submitOtp(digits.join(''))}
                  loading={otpLoading}
                  disabled={digits.some((d) => !d)}
                />
              </View>

              {/* Resend Timer */}
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                {resendTimer > 0 ? (
                  <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                    {t('auth.resendIn', { seconds: resendTimer })}
                  </Text>
                ) : (
                  <TextButton label={t('auth.resend')} onPress={resend} />
                )}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  otpBox: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  mockHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
