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

  it('creates stable localized paths', () => {
    expect(localizePath('/', 'en')).toBe('/tolvira/');
    expect(localizePath('/tolvira/', 'pt-BR')).toBe('/tolvira/pt-br/');
    expect(localizePath('/tolvira/pt-br/', 'es')).toBe('/tolvira/es/');
    expect(localizePath('/tools/', 'en')).toBe('/tolvira/tools/');
    expect(localizePath('/tools/', 'pt-BR')).toBe('/tolvira/pt-br/tools/');
    expect(localizePath('/es/tools/', 'pt-BR')).toBe('/tolvira/pt-br/tools/');
  });

  it('preserves file paths under the GitHub Pages base', () => {
    expect(assetPath('/favicon.svg')).toBe('/tolvira/favicon.svg');
    expect(assetPath('/brand/social-card.png')).toBe('/tolvira/brand/social-card.png');
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
