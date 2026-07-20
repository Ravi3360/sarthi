/**
 * SAATHI design tokens.
 *
 * Palette is deliberately warm-red and high-contrast: this app is used by
 * first-time smartphone users on budget Android devices in bright daylight,
 * so every token favors legibility over subtlety.
 */

const colors = {
  light: {
    // Legacy aliases (kept for compatibility with scaffold components)
    text: '#1A1A1A',
    tint: '#E31E24',

    // Core surfaces
    background: '#FFFFFF',
    foreground: '#1A1A1A',

    // Cards / elevated surfaces
    card: '#F7F7F7',
    cardForeground: '#1A1A1A',

    // Primary action color (buttons, links, active states)
    primary: '#E31E24',
    primaryDark: '#B71C1C',
    primaryTint: '#FDE8E9',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#F7F7F7',
    secondaryForeground: '#1A1A1A',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F7F7F7',
    mutedForeground: '#6B6B6B',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FDE8E9',
    accentForeground: '#B71C1C',

    // Destructive / error
    destructive: '#D32F2F',
    destructiveForeground: '#FFFFFF',
    error: '#D32F2F',

    // Status colors
    success: '#2E7D32',
    successTint: '#E6F4EA',
    warning: '#F9A825',
    warningTint: '#FFF6E0',

    // Borders and input outlines
    border: '#E5E5E5',
    input: '#E5E5E5',
  },

  dark: {
    // Legacy aliases
    text: '#FFFFFF',
    tint: '#FF6B35',

    // Core surfaces — dark background
    background: '#0F0F0F',
    foreground: '#FFFFFF',

    // Cards / elevated surfaces — slightly lighter than background
    card: '#1A1A1A',
    cardForeground: '#FFFFFF',

    // Primary action — orange/red for better visibility on dark
    primary: '#FF6B35',
    primaryDark: '#E55100',
    primaryTint: 'rgba(255, 107, 53, 0.15)',
    primaryForeground: '#FFFFFF',

    // Secondary surfaces
    secondary: '#1A1A1A',
    secondaryForeground: '#FFFFFF',

    // Muted elements
    muted: '#2A2A2A',
    mutedForeground: '#999999',

    // Accent highlights
    accent: 'rgba(255, 107, 53, 0.2)',
    accentForeground: '#FF6B35',

    // Destructive / error
    destructive: '#FF5252',
    destructiveForeground: '#FFFFFF',
    error: '#FF5252',

    // Status colors — brighter for dark background
    success: '#4CAF50',
    successTint: 'rgba(76, 175, 80, 0.15)',
    warning: '#FFC107',
    warningTint: 'rgba(255, 193, 7, 0.15)',

    // Borders
    border: '#2A2A2A',
    input: '#2A2A2A',
  },

  // Border radius (in px)
  radius: 16,
};

export default colors;
