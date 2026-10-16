/*
 * Preferências de exibição salvas no navegador.
 * O script inline do <head> em BaseLayout repete estas chaves para aplicar o estado antes da pintura;
 * mantenha os dois em sincronia ao alterar nomes ou valores.
 */
export const preferenceKeys = {
  theme: 'noduct-theme',
  art: 'noduct-art',
  motion: 'noduct-motion',
  locale: 'noduct-locale',
} as const;

export const preferencesChangeEvent = 'noduct:preferences';

export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Armazenamento indisponível: a preferência vale só para esta página.
  }
}

/** Salva a preferência e a reflete no <html> (o tema claro é o padrão). */
export function setPreference(key: string, value: string | null): void {
  writePreference(key, value);
  const root = document.documentElement;
  if (key === preferenceKeys.theme) switchTheme(root, value === 'dark' ? 'dark' : 'light');
  if (key === preferenceKeys.art) toggleAttribute(root, 'art', value);
  if (key === preferenceKeys.motion) toggleAttribute(root, 'motion', value);
  window.dispatchEvent(new Event(preferencesChangeEvent));
}

function toggleAttribute(root: HTMLElement, name: 'art' | 'motion', value: string | null): void {
  if (value === null) delete root.dataset[name];
  else root.dataset[name] = value;
}

/** Troca o tema sem transições: elas são suspensas até o frame seguinte ao da nova pintura. */
function switchTheme(root: HTMLElement, theme: 'light' | 'dark'): void {
  if (root.dataset.theme === theme) return;
  root.dataset.themeSwitching = '';
  root.dataset.theme = theme;
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => delete root.dataset.themeSwitching));
}
