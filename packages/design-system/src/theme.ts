export const THEME_COLOR_TOKEN = '--color-primary';

export const themeColors = {
  light: '#2563eb',
  dark: '#3b82f6'
} as const;

export type ThemeName = keyof typeof themeColors;
