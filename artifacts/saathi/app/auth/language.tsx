import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appLanguages } from '@/constants/languages';
import { storageKeys } from '@/services/storageKeys';
import { useColors } from '@/hooks/useColors';
import { IconTile } from '@/components/ui';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const selectLanguage = async (key: string) => {
    if (key !== 'hi') return;
    await AsyncStorage.setItem(storageKeys.locale, key);
    router.replace('/auth/phone');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 32 }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{t('auth.chooseLanguage')}</Text>
      <View style={styles.grid}>
        {appLanguages.map((lang) => (
          <View key={lang.key} style={styles.tileWrap}>
            <IconTile
              icon="globe"
              label={lang.enabled ? lang.labelNative : `${lang.labelNative}\n(${t('auth.comingSoonLanguage')})`}
              selected={lang.key === 'hi'}
              onPress={() => selectLanguage(lang.key)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  tileWrap: {
    width: '30%',
  },
});
