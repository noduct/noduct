/**
 * Locales do ecossistema Noduct. Fonte única: hub, ferramentas e scripts importam daqui.
 * O segmento de URL do locale padrão é vazio; os demais são minúsculos (`pt-br`, `es`).
 */
export const LOCALES = ['en', 'pt-BR', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export type LocaleSegment = '' | 'pt-br' | 'es';

export const LOCALE_SEGMENT: Readonly<Record<Locale, LocaleSegment>> = Object.freeze({
  en: '',
  'pt-BR': 'pt-br',
  es: 'es'
});

/** Segmentos de URL que representam um locale diferente do padrão. */
export const LOCALE_SEGMENTS: readonly Exclude<LocaleSegment, ''>[] = ['pt-br', 'es'];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeFromSegment(segment: string): Locale | undefined {
  return LOCALES.find((locale) => LOCALE_SEGMENT[locale] === segment && segment !== '');
}

/** Escolhe o primeiro idioma suportado da lista do navegador; o padrão é inglês. */
export function resolveBrowserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const normalized = language.toLowerCase();
    if (normalized === 'pt' || normalized.startsWith('pt-')) return 'pt-BR';
    if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  }
  return DEFAULT_LOCALE;
}

/** `getStaticPaths` para rotas `[locale]`: um caminho por locale diferente do padrão. */
export function localeStaticPaths(): Array<{ params: { locale: string }; props: { locale: Locale } }> {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({
    params: { locale: LOCALE_SEGMENT[locale] },
    props: { locale }
  }));
}
