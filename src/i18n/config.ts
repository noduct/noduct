export const locales = ['en', 'pt-BR', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const siteBasePath = '/noduct';
export const localePrefixes: Record<Locale, string> = { en: '', 'pt-BR': '/pt-br', es: '/es' };

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveBrowserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const normalized = language.toLowerCase();
    if (normalized === 'pt' || normalized.startsWith('pt-')) return 'pt-BR';
    if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  }
  return defaultLocale;
}

export function localizePath(pathname: string, locale: Locale): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withoutBase = path.replace(new RegExp(`^${siteBasePath}(?=/|$)`), '') || '/';
  const normalized = withoutBase === '/' ? '/' : `${withoutBase.replace(/^\/(?:pt-br|es)(?=\/|$)/, '').replace(/\/$/, '')}/`;
  const localized = locale === 'en' ? normalized : `${localePrefixes[locale]}${normalized === '/' ? '/' : normalized}`;
  return localized === '/' ? `${siteBasePath}/` : `${siteBasePath}${localized}`;
}

/** Adiciona o base path do GitHub Pages sem transformar arquivos em rotas de diretório. */
export function assetPath(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withoutBase = path.replace(new RegExp(`^${siteBasePath}(?=/|$)`), '') || '/';
  return `${siteBasePath}${withoutBase}`;
}
