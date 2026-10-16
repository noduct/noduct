import { describe, expect, it } from 'vitest';
import { createSeoMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/config';

describe('localized canonical metadata', () => {
  it.each<[Locale, string]>([
    ['en', '/noduct/privacy/'],
    ['pt-BR', '/noduct/pt-br/privacy/'],
    ['es', '/noduct/es/privacy/']
  ])('keeps the %s version self-canonical', (locale, pathname) => {
    const metadata = createSeoMetadata(
      pathname,
      'Privacy',
      'Privacy information.',
      '/brand/og-image.png',
      false,
      locale
    );
    expect(metadata.canonical.href).toBe(`https://noduct.github.io${pathname}`);
    expect(metadata.image.href).toBe('https://noduct.github.io/noduct/brand/og-image.png');
  });
});
