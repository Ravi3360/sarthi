import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { FloatingTabBar } from '@/components/FloatingTabBar';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  const { t } = useTranslation();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('tabs.home')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schemes">
        <Icon sf={{ default: 'shield', selected: 'shield.fill' }} />
        <Label>{t('tabs.schemes')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="income">
        <Icon sf={{ default: 'indianrupeesign.circle', selected: 'indianrupeesign.circle.fill' }} />
        <Label>{t('tabs.income')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// The default React Navigation tab bar is fully hidden (tabBarStyle: display
// 'none') and replaced by <FloatingTabBar />, a fixed always-visible bar —
// something we fully own rendering of rather than fight screenOptions for.
function ClassicTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="schemes" />
        <Tabs.Screen name="income" />
      </Tabs>
      <FloatingTabBar />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
