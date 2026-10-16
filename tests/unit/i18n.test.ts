import { getLocalizedCategories } from '@/data/categories';
import { getLocalizedTools } from '@/data/tools';
import { assetPath, localizePath, resolveBrowserLocale } from '@/i18n/config';
import { describe, expect, it } from 'vitest';

describe('internationalization', () => {
  it('maps browser language families and falls back to English', () => {
    expect(resolveBrowserLocale(['pt-PT'])).toBe('pt-BR');
    expect(resolveBrowserLocale(['es-MX'])).toBe('es');
    expect(resolveBrowserLocale(['fr-FR'])).toBe('en');
    expect(resolveBrowserLocale(['ja-JP', 'es'])).toBe('es');
  });

  it('creates stable localized paths at the hub root', () => {
    expect(localizePath('/', 'en')).toBe('/');
    expect(localizePath('/', 'pt-BR')).toBe('/pt-br/');
    expect(localizePath('/pt-br/', 'es')).toBe('/es/');
    expect(localizePath('/tools/', 'en')).toBe('/tools/');
    expect(localizePath('/tools/', 'pt-BR')).toBe('/pt-br/tools/');
    expect(localizePath('/es/tools/', 'pt-BR')).toBe('/pt-br/tools/');
    expect(localizePath('/es/pdf-tools', 'en')).toBe('/pdf-tools/');
  });

  it('never prefixes public files with a locale', () => {
    expect(assetPath('/brand/favicon.svg')).toBe('/brand/favicon.svg');
    expect(assetPath('brand/og-image.png')).toBe('/brand/og-image.png');
  });

  it('has a complete localized catalog', () => {
    const english = getLocalizedTools('en');
    for (const locale of ['pt-BR', 'es'] as const) {
      const localized = getLocalizedTools(locale);
      expect(localized).toHaveLength(english.length);
      expect(localized.every((tool) => tool.name && tool.description && tool.keywords.length)).toBe(true);
      expect(getLocalizedCategories(locale).every((category) => category.name && category.shortName && category.description)).toBe(true);
    }
  });
});
