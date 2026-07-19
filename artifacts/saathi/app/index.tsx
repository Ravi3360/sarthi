import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useWorker } from '@/context/WorkerContext';
import { TOTAL_ONBOARDING_STEPS } from '@/constants/onboardingSteps';

export default function SplashGate() {
  const { t } = useTranslation();
  const colors = useColors();
  const { uid, isLoading: authLoading } = useAuth();
  const { worker, isLoading: workerLoading } = useWorker();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stillDeciding = authLoading || (uid ? workerLoading : false) || !minTimeElapsed;

  if (!stillDeciding) {
    if (!uid) {
      return <Redirect href="/auth/language" />;
    }
    if (worker && worker.lastCompletedStep >= TOTAL_ONBOARDING_STEPS) {
      return <Redirect href="/(tabs)/home" />;
    }
    const nextStep = worker ? Math.min(worker.lastCompletedStep + 1, TOTAL_ONBOARDING_STEPS) : 1;
    return <Redirect href={`/onboarding/${nextStep}`} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.logoCircle, { backgroundColor: colors.primaryForeground }]}>
        <Feather name="shield" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.primaryForeground }]}>{t('auth.welcome')}</Text>
      <Text style={[styles.tagline, { color: colors.primaryTint }]}>{t('auth.tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
  },
});
