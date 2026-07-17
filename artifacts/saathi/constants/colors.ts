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

  // Border radius (in px)
  radius: 12,
};

export default colors;
