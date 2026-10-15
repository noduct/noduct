import { describe, expect, it } from 'vitest';
import { createSeoMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/config';

describe('localized canonical metadata', () => {
  it.each<[Locale, string]>([
    ['en', '/tolvira/privacy/'],
    ['pt-BR', '/tolvira/pt-br/privacy/'],
    ['es', '/tolvira/es/privacy/']
  ])('keeps the %s version self-canonical', (locale, pathname) => {
    const metadata = createSeoMetadata(
      pathname,
      'Privacy',
      'Privacy information.',
      '/brand/social-card.png',
      false,
      locale
    );
    expect(metadata.canonical.href).toBe(`https://tolvira.github.io${pathname}`);
    expect(metadata.image.href).toBe('https://tolvira.github.io/tolvira/brand/social-card.png');
  });
});
