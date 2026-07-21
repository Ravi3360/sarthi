import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

interface QuickActionTileProps {
  label: string;
  onPress: () => void;
  bgGradient: [string, string];
  chipGradient: [string, string];
  labelColor: string;
  icon: 'upload' | 'coins' | 'gift' | 'briefcase';
}

const iconMap = {
  upload: (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 4V14M16 4L12 8M16 4L20 8"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 16H24"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8 20C6.9 20 6 20.9 6 22V26C6 27.1 6.9 28 8 28H24C25.1 28 26 27.1 26 26V22C26 20.9 25.1 20 24 20"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  coins: (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={16} r={12} stroke="white" strokeWidth={2} />
      <Path
        d="M16 12V20M13 16H19"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={22} cy={12} r={8} fill="white" opacity={0.2} />
    </Svg>
  ),
  gift: (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Rect x={6} y={10} width={20} height={16} rx={2} stroke="white" strokeWidth={1.5} />
      <Path
        d="M16 10V28M12 14V10H20V14"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={16} cy={12} r={1.5} fill="white" />
    </Svg>
  ),
  briefcase: (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Rect x={6} y={10} width={20} height={14} rx={2} stroke="white" strokeWidth={1.5} />
      <Path d="M10 10V8C10 7.4 10.4 7 11 7H21C21.6 7 22 7.4 22 8V10" stroke="white" strokeWidth={1.5} />
      <Circle cx={16} cy={17} r={1.5} fill="white" />
    </Svg>
  ),
};

export function QuickActionTile({
  label,
  onPress,
  bgGradient,
  chipGradient,
  labelColor,
  icon,
}: QuickActionTileProps) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          {
            shadowColor: bgGradient[0],
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={chipGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.iconChip,
              {
                shadowColor: chipGradient[1],
                shadowOpacity: 0.35,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            {iconMap[icon]}
          </LinearGradient>

          <Text
            style={[
              styles.label,
              { color: labelColor },
            ]}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    maxWidth: '48%',
  },
  container: {
    borderRadius: 20,
    padding: 20,
    paddingTop: 24,
    aspectRatio: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
