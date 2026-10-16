import { describe, expect, it } from 'vitest';
import { LOCALES, localeStaticPaths, resolveBrowserLocale } from './locale';
import { CATEGORY_IDS, categoryPath, getCategories } from './taxonomy';
import {
  HUB_SCOPE,
  RESERVED_HUB_SEGMENTS,
  createTopology,
  normalizePath,
  toolScope,
  topology
} from './topology';
import { breadcrumbList, fullTitle, jsonLdGraph, pageSeo } from './seo';
import { defineTool } from './define-tool';

describe('topology — production table', () => {
  const cases: Array<[string, string]> = [
    [topology.hubUrl(), 'https://noduct.github.io/'],
    [topology.hubUrl('', 'pt-BR'), 'https://noduct.github.io/pt-br/'],
    [topology.hubUrl('', 'es'), 'https://noduct.github.io/es/'],
    [topology.hubUrl('tools/', 'en'), 'https://noduct.github.io/tools/'],
    [topology.hubUrl('tools', 'pt-BR'), 'https://noduct.github.io/pt-br/tools/'],
    [topology.hubUrl(categoryPath('pdf-tools'), 'es'), 'https://noduct.github.io/es/pdf-tools/'],
    [topology.toolUrl('merge-pdf'), 'https://noduct.github.io/merge-pdf/'],
    [topology.toolUrl('merge-pdf', '', 'pt-BR'), 'https://noduct.github.io/merge-pdf/pt-br/'],
    [topology.toolUrl('merge-pdf', '', 'es'), 'https://noduct.github.io/merge-pdf/es/'],
    [topology.hubAssetUrl('brand/og-image.png'), 'https://noduct.github.io/brand/og-image.png'],
    [topology.registryUrl, 'https://noduct.github.io/data/sponsorships.json'],
    [topology.hubPath('', 'pt-BR'), '/pt-br/'],
    [topology.toolPath('merge-pdf', '', 'es'), '/merge-pdf/es/']
  ];
  it.each(cases)('%s', (actual, expected) => expect(actual).toBe(expected));

  it('never applies a locale prefix to files', () => {
    expect(topology.hubPath('data/sponsorships.json', 'pt-BR')).toBe('/data/sponsorships.json');
  });

  it('maps Astro site/base from the scope', () => {
    expect(topology.astro(HUB_SCOPE)).toEqual({ site: 'https://noduct.github.io', base: '/' });
    expect(topology.astro(toolScope('merge-pdf'))).toEqual({ site: 'https://noduct.github.io', base: '/merge-pdf' });
  });
});

describe('topology — invariants', () => {
  const scopes = [HUB_SCOPE, toolScope('merge-pdf'), toolScope('split-pdf')];
  const paths = ['', 'tools/', 'pdf-tools', 'about/'];
  for (const scope of scopes)
    for (const path of paths)
      for (const locale of LOCALES) {
        const url = topology.scopeUrl(scope, path, locale);
        it(`${url} is well formed and round-trips`, () => {
          expect(url.startsWith('https://noduct.github.io/')).toBe(true);
          expect(url.slice('https://'.length)).not.toContain('//');
          expect(url.match(/\/(pt-br|es)\//g)?.length ?? 0).toBeLessThanOrEqual(1);
          expect(url.endsWith('/')).toBe(true);
          const parsed = topology.parse(url);
          expect(parsed).not.toBeNull();
          expect(parsed?.locale).toBe(locale);
          expect(parsed?.scope).toEqual(scope);
          expect(topology.scopeUrl(parsed!.scope, parsed!.path, parsed!.locale)).toBe(url);
        });
      }

  it('normalization is idempotent', () => {
    for (const path of ['', 'tools', '/tools/', 'a/b', 'brand/logo.svg'])
      expect(normalizePath(normalizePath(path))).toBe(normalizePath(path));
  });

  it('rejects unsafe paths', () => {
    for (const path of ['../x', 'a/../b', 'a//b', 'x?y', 'x#y', 'https://evil.test/', '//evil.test'])
      expect(() => normalizePath(path)).toThrow();
  });

  it('emits reciprocal alternates with x-default = en', () => {
    const alternates = topology.alternates(toolScope('merge-pdf'), '');
    expect(alternates.map((a) => a.hreflang)).toEqual(['en', 'pt-BR', 'es', 'x-default']);
    expect(alternates.at(-1)?.href).toBe(alternates[0]?.href);
  });

  it('parses legacy and foreign URLs safely', () => {
    expect(topology.parse('https://example.test/merge-pdf/')).toBeNull();
    expect(topology.parse('/pt-br/pdf-tools/')).toEqual({ scope: HUB_SCOPE, locale: 'pt-BR', path: 'pdf-tools/' });
  });
});

describe('topology — slugs', () => {
  it('rejects reserved and malformed slugs', () => {
    for (const slug of ['tools', 'pt-br', 'noduct', 'pdf-tools', '_astro', 'Merge', 'merge_pdf', '-x'])
      expect(() => topology.toolBase(slug)).toThrow();
  });

  it('keeps hub pages out of the tool namespace', () => {
    expect(() => topology.hubPath('merge-pdf/')).toThrow();
    expect(topology.toolPath('merge-pdf', 'a/b/')).toBe('/merge-pdf/a/b/');
  });

  it('reserves every category and locale segment', () => {
    for (const id of CATEGORY_IDS) expect(RESERVED_HUB_SEGMENTS.has(id)).toBe(true);
    expect(RESERVED_HUB_SEGMENTS.has('noduct')).toBe(true);
  });
});

describe('topology — injectable origin', () => {
  it('has no hard-coded host outside the production instance', () => {
    const test = createTopology({ origin: 'https://example.test', hubBase: '/sub' });
    const outputs = [
      test.hubUrl('', 'es'),
      test.toolUrl('merge-pdf', '', 'pt-BR'),
      test.registryUrl,
      ...test.alternates(HUB_SCOPE, '').map((a) => a.href)
    ];
    for (const output of outputs) {
      expect(output.startsWith('https://example.test/sub/')).toBe(true);
      expect(output).not.toContain('noduct.github.io');
    }
    expect(test.parse('https://example.test/sub/merge-pdf/es/')).toEqual({
      scope: toolScope('merge-pdf'),
      locale: 'es',
      path: ''
    });
  });
});

describe('locale, taxonomy, seo and defineTool', () => {
  it('resolves browser languages', () => {
    expect(resolveBrowserLocale(['pt-PT'])).toBe('pt-BR');
    expect(resolveBrowserLocale(['fr', 'es-MX'])).toBe('es');
    expect(resolveBrowserLocale(['fr'])).toBe('en');
  });

  it('builds [locale] static paths for non-default locales', () => {
    expect(localeStaticPaths()).toEqual([
      { params: { locale: 'pt-br' }, props: { locale: 'pt-BR' } },
      { params: { locale: 'es' }, props: { locale: 'es' } }
    ]);
  });

  it('localizes every category in every locale', () => {
    for (const locale of LOCALES) {
      const categories = getCategories(locale);
      expect(categories.map((c) => c.id)).toEqual([...CATEGORY_IDS]);
      for (const category of categories) expect(category.name.length).toBeGreaterThan(0);
    }
  });

  it('builds page SEO and a single JSON-LD graph', () => {
    const seo = pageSeo(toolScope('merge-pdf'), '', 'es');
    expect(seo.canonical).toBe('https://noduct.github.io/merge-pdf/es/');
    expect(fullTitle('Merge PDF')).toBe('Merge PDF | Noduct');
    expect(fullTitle('Noduct')).toBe('Noduct');
    const graph = jsonLdGraph([breadcrumbList([{ name: 'Noduct', url: topology.hubUrl() }])]);
    expect(graph['@graph']).toHaveLength(1);
  });

  it('declares tools with defaults and validates the slug', () => {
    const tool = defineTool({ slug: 'merge-pdf', category: 'pdf-tools', published: true });
    expect(tool.scope).toEqual(toolScope('merge-pdf'));
    expect(tool.sponsorPlacementId).toBe('merge-pdf.primary');
    expect(() => defineTool({ slug: 'about', category: 'pdf-tools', published: false })).toThrow();
  });
});
