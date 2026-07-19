import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const TABS: { key: string; path: '/(tabs)/home' | '/(tabs)/schemes' | '/(tabs)/income'; icon: keyof typeof Feather.glyphMap; labelKey: string }[] = [
  { key: 'home', path: '/(tabs)/home', icon: 'home', labelKey: 'tabs.home' },
  { key: 'schemes', path: '/(tabs)/schemes', icon: 'shield', labelKey: 'tabs.schemes' },
  { key: 'income', path: '/(tabs)/income', icon: 'bar-chart-2', labelKey: 'tabs.income' },
];

/**
 * Replaces the default React Navigation tab bar entirely (which is hidden
 * via `tabBarStyle: { display: 'none' }` in the tabs layout) with a fixed,
 * always-visible, full-width bar flush to the bottom edge, Instagram-style.
 */
export function FloatingTabBar() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const pathname = usePathname();

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 6) }]}>
      {isIOS ? (
        <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
      )}
      <View style={styles.row}>
        {TABS.map((tab) => {
          const isFocused = pathname === `/${tab.key}`;
          return (
            <Pressable key={tab.key} onPress={() => router.replace(tab.path)} style={styles.item} hitSlop={8}>
              <Feather name={tab.icon} size={24} color={isFocused ? colors.primary : colors.mutedForeground} />
              <Text numberOfLines={1} style={[styles.label, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 18,
    minWidth: 68,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
