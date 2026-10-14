import { describe, expect, it } from 'vitest';
import { localizePath, resolveBrowserLocale } from '@/i18n/config';
import { getLocalizedTools } from '@/data/tools';
import { getLocalizedCategories } from '@/data/categories';

describe('internationalization', () => {
  it('maps browser language families and falls back to English', () => {
    expect(resolveBrowserLocale(['pt-PT'])).toBe('pt-BR');
    expect(resolveBrowserLocale(['es-MX'])).toBe('es');
    expect(resolveBrowserLocale(['fr-FR'])).toBe('en');
    expect(resolveBrowserLocale(['ja-JP', 'es'])).toBe('es');
  });

  it('creates stable localized paths', () => {
    expect(localizePath('/tools/', 'en')).toBe('/tools/');
    expect(localizePath('/tools/', 'pt-BR')).toBe('/pt-br/tools/');
    expect(localizePath('/es/tools/', 'pt-BR')).toBe('/pt-br/tools/');
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
