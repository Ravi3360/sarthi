import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  testID?: string;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDisabled ? colors.mutedForeground : colors.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <>
          {icon && <Feather name={icon} size={20} color={colors.primaryForeground} />}
          <Text style={[styles.buttonLabel, { color: colors.primaryForeground }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, loading, disabled, icon, testID }: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDisabled ? colors.border : colors.primary,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {icon && <Feather name={icon} size={20} color={colors.primary} />}
          <Text style={[styles.buttonLabel, { color: isDisabled ? colors.mutedForeground : colors.primary }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function TextButton({ label, onPress, disabled, testID }: ButtonProps) {
  const colors = useColors();
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} hitSlop={8}>
      {({ pressed }) => (
        <Text
          style={{
            color: disabled ? colors.mutedForeground : colors.primary,
            fontSize: 16,
            fontWeight: '600',
            opacity: pressed ? 0.6 : 1,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Cards / badges / chips / avatar
// ---------------------------------------------------------------------------

export function Card({
  children,
  style,
  onTouchEnd,
}: {
  children: React.ReactNode;
  style?: object;
  onTouchEnd?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </View>
  );
}

export function Badge({ label, tone = 'success' }: { label: string; tone?: 'success' | 'warning' | 'neutral' }) {
  const colors = useColors();
  const bg = tone === 'success' ? colors.successTint : tone === 'warning' ? colors.warningTint : colors.muted;
  const fg = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.mutedForeground;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryTint : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={{ color: selected ? colors.primaryDark : colors.mutedForeground, fontSize: 14, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Avatar({ uri, name, size = 56 }: { uri?: string | null; name: string; size?: number }) {
  const colors = useColors();
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  if (uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Img uri={uri} size={size} />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.primaryDark, fontSize: size * 0.4, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

function Img({ uri, size }: { uri: string; size: number }) {
  const { Image } = require('expo-image');
  return <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressRing({ percent, size = 64 }: { percent: number; size?: number }) {
  const colors = useColors();
  const strokeWidth = size * 0.11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.22, fontWeight: '700', color: colors.foreground }}>{clamped}%</Text>
        </View>
      </View>
    </View>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export function StepHeader({
  title,
  step,
  total,
  onBack,
}: {
  title: string;
  step?: number;
  total?: number;
  onBack?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, flex: 1 }}>{title}</Text>
        {step !== undefined && total !== undefined && (
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontWeight: '600' }}>
            {step}/{total}
          </Text>
        )}
      </View>
      {step !== undefined && total !== undefined && <ProgressDots total={total} current={step} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function EmptyState({
  icon = 'inbox',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateIconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={26} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle && <Text style={[styles.stateSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <View style={{ marginTop: 16, minWidth: 180 }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label && <Text style={[styles.stateSubtitle, { color: colors.mutedForeground, marginTop: 12 }]}>{label}</Text>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.stateContainer}>
      <View style={[styles.stateIconWrap, { backgroundColor: colors.warningTint }]}>
        <Feather name="alert-triangle" size={26} color={colors.warning} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{message}</Text>
      {onRetry && (
        <View style={{ marginTop: 16, minWidth: 180 }}>
          <SecondaryButton label="फिर कोशिश करें" onPress={onRetry} icon="refresh-cw" />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// IconTile — used in quick-action grids, occupation picker, document locker
// ---------------------------------------------------------------------------

export function IconTile({
  icon,
  label,
  onPress,
  selected,
  statusDot,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  selected?: boolean;
  statusDot?: 'success' | 'warning' | 'none';
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? colors.primaryTint : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      {statusDot && statusDot !== 'none' && (
        <View
          style={[
            styles.tileDot,
            { backgroundColor: statusDot === 'success' ? colors.success : colors.warning },
          ]}
        />
      )}
      <View
        style={[
          styles.tileIconBg,
          { backgroundColor: selected ? colors.primary : colors.primaryTint },
        ]}
      >
        <Feather name={icon} size={28} color={selected ? '#FFFFFF' : colors.primary} />
      </View>
      <Text
        numberOfLines={2}
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: selected ? colors.primaryDark : colors.foreground,
          textAlign: 'center',
          marginTop: 6,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 60,
    borderRadius: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 4,
  },
  stateIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tile: {
    width: '100%',
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  tileIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
