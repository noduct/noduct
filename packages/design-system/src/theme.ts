export const THEME_COLOR_TOKEN = '--color-primary';

export const themeColors = {
  light: '#1d58d8',
  dark: '#5294ff'
} as const;

export type ThemeName = keyof typeof themeColors;
