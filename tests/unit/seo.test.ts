import { describe, expect, it } from 'vitest';
import { createSeoMetadata } from '@/lib/seo';
import type { Locale } from '@/i18n/config';
import { topology } from '@noduct/tool-runtime';

describe('localized canonical metadata', () => {
  it.each<[Locale, string]>([
    ['en', '/privacy/'],
    ['pt-BR', '/pt-br/privacy/'],
    ['es', '/es/privacy/']
  ])('keeps the %s version self-canonical', (locale, pathname) => {
    const metadata = createSeoMetadata(
      pathname,
      'Privacy',
      'Privacy information.',
      '/brand/og-image.png',
      false,
      locale
    );
    expect(metadata.canonical.href).toBe(`${topology.origin}${pathname}`);
    expect(metadata.image.href).toBe(topology.hubAssetUrl('brand/og-image.png'));
  });
});
