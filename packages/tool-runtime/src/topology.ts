import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_SEGMENT,
  LOCALE_SEGMENTS,
  localeFromSegment,
  type Locale
} from './locale.ts';
import { CATEGORY_IDS } from './taxonomy.ts';

/**
 * Topologia de URLs do Noduct (ADR 0005). ÚNICO lugar do repositório onde a origem e os bases
 * aparecem como literais; todo o resto deriva daqui.
 *
 *   hub         {hubBase}{locale/}{path}           ex.: /pt-br/pdf-tools/
 *   ferramenta  {hubBase}{slug}/{locale/}{path}    ex.: /merge-pdf/es/
 *
 * Caminhos de página terminam em `/`; caminhos com extensão (`.json`, `.png`) são arquivos e nunca
 * recebem prefixo de locale.
 */
export const NODUCT_ORIGIN = 'https://noduct.github.io';
export const NODUCT_HUB_BASE = '/';

/**
 * Segmentos de primeiro nível que pertencem ao hub. Ferramentas nunca podem usar esses slugs,
 * porque ocupariam o mesmo caminho na raiz da origem. `noduct` fica reservado para sempre: era o
 * base antigo do hub e hospeda os stubs de redirecionamento.
 */
export const RESERVED_HUB_SEGMENTS: ReadonlySet<string> = new Set<string>([
  ...CATEGORY_IDS,
  ...LOCALE_SEGMENTS,
  'en',
  'tools',
  'categories',
  'about',
  'contact',
  'privacy',
  'terms',
  'sponsor',
  // Página de gestão da Área de Trabalho Local (ADR 0006).
  'workspace',
  'data',
  'brand',
  '404',
  '_astro',
  'noduct'
]);

export type Scope = { readonly kind: 'hub' } | { readonly kind: 'tool'; readonly slug: string };
export const HUB_SCOPE: Scope = Object.freeze({ kind: 'hub' });
export const toolScope = (slug: string): Scope => Object.freeze({ kind: 'tool', slug });

export interface Alternate {
  readonly hreflang: Locale | 'x-default';
  readonly href: string;
}

export interface ParsedUrl {
  readonly scope: Scope;
  readonly locale: Locale;
  /** Caminho dentro do escopo, sem base, slug ou locale (ex.: `pdf-tools/`, `''`). */
  readonly path: string;
}

export interface TopologyConfig {
  readonly origin: string;
  readonly hubBase: string;
}

export interface Topology {
  readonly origin: string;
  readonly hubBase: string;
  toolBase(slug: string): string;
  hubPath(path?: string, locale?: Locale): string;
  hubUrl(path?: string, locale?: Locale): string;
  toolPath(slug: string, path?: string, locale?: Locale): string;
  toolUrl(slug: string, path?: string, locale?: Locale): string;
  scopePath(scope: Scope, path?: string, locale?: Locale): string;
  scopeUrl(scope: Scope, path?: string, locale?: Locale): string;
  canonical(scope: Scope, path: string, locale: Locale): string;
  alternates(scope: Scope, path: string): readonly Alternate[];
  hubAssetPath(file: string): string;
  hubAssetUrl(file: string): string;
  readonly registryUrl: string;
  astro(scope: Scope): { site: string; base: string };
  parse(url: string): ParsedUrl | null;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertToolSlug(slug: string): void {
  if (!SLUG.test(slug)) throw new Error(`Invalid tool slug "${slug}": use lowercase kebab-case.`);
  if (RESERVED_HUB_SEGMENTS.has(slug))
    throw new Error(`Tool slug "${slug}" is reserved by the hub.`);
}

/** Normaliza um caminho relativo: sem barra inicial; diretórios terminam em `/`, arquivos não. */
export function normalizePath(path = ''): string {
  if (/[?#]/.test(path) || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) {
    throw new Error(`Path "${path}" must be a relative path without query, hash or scheme.`);
  }
  const trimmed = path.replace(/^\/+/, '');
  if (trimmed === '') return '';
  const segments = trimmed.split('/');
  const last = segments[segments.length - 1] ?? '';
  const inner = last === '' ? segments.slice(0, -1) : segments;
  if (inner.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`Path "${path}" contains empty, "." or ".." segments.`);
  }
  return isFile(trimmed) ? trimmed : `${inner.join('/')}/`;
}

const isFile = (path: string): boolean => /\.[a-z0-9]+$/i.test(path.split('/').pop() ?? '');

function normalizeBase(base: string): string {
  if (!base.startsWith('/')) throw new Error(`Base "${base}" must start with "/".`);
  return base.endsWith('/') ? base : `${base}/`;
}

export function createTopology(config: TopologyConfig): Topology {
  const origin = config.origin.replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+$/.test(origin))
    throw new Error(`Origin "${config.origin}" must be scheme + host only.`);
  const hubBase = normalizeBase(config.hubBase);

  const localized = (prefix: string, path: string, locale: Locale): string => {
    const normalized = normalizePath(path);
    const segment = LOCALE_SEGMENT[locale];
    if (isFile(normalized) || segment === '') return `${prefix}${normalized}`;
    return `${prefix}${segment}/${normalized}`;
  };

  const toolBase = (slug: string): string => {
    assertToolSlug(slug);
    return `${hubBase}${slug}/`;
  };

  const scopePrefix = (scope: Scope): string =>
    scope.kind === 'hub' ? hubBase : toolBase(scope.slug);
  const scopePath = (scope: Scope, path = '', locale: Locale = DEFAULT_LOCALE): string => {
    if (scope.kind === 'hub') {
      // Páginas do hub vivem só sob segmentos reservados; o resto do namespace é das ferramentas.
      const first = normalizePath(path).split('/')[0] ?? '';
      if (first !== '' && !isFile(first) && !RESERVED_HUB_SEGMENTS.has(first)) {
        throw new Error(
          `Hub path "${path}" must start with a reserved hub segment (see RESERVED_HUB_SEGMENTS).`
        );
      }
    }
    return localized(scopePrefix(scope), path, locale);
  };
  const scopeUrl = (scope: Scope, path = '', locale: Locale = DEFAULT_LOCALE): string =>
    `${origin}${scopePath(scope, path, locale)}`;

  const hubAssetPath = (file: string): string => {
    const normalized = normalizePath(file);
    if (!isFile(normalized))
      throw new Error(`Asset "${file}" must be a file path with an extension.`);
    return `${hubBase}${normalized}`;
  };

  const topology: Topology = {
    origin,
    hubBase,
    toolBase,
    hubPath: (path, locale) => scopePath(HUB_SCOPE, path, locale),
    hubUrl: (path, locale) => scopeUrl(HUB_SCOPE, path, locale),
    toolPath: (slug, path, locale) => scopePath(toolScope(slug), path, locale),
    toolUrl: (slug, path, locale) => scopeUrl(toolScope(slug), path, locale),
    scopePath,
    scopeUrl,
    canonical: (scope, path, locale) => scopeUrl(scope, path, locale),
    alternates: (scope, path) => [
      ...LOCALES.map((locale) => ({ hreflang: locale, href: scopeUrl(scope, path, locale) })),
      { hreflang: 'x-default' as const, href: scopeUrl(scope, path, DEFAULT_LOCALE) }
    ],
    hubAssetPath,
    hubAssetUrl: (file) => `${origin}${hubAssetPath(file)}`,
    registryUrl: `${origin}${hubAssetPath('data/sponsorships.json')}`,
    astro: (scope) => ({
      site: origin,
      base: scope.kind === 'hub' ? hubBase : toolBase(scope.slug).replace(/\/$/, '')
    }),
    parse(url) {
      let pathname: string;
      try {
        const parsed = new URL(url, `${origin}/`);
        if (parsed.origin !== origin) return null;
        pathname = parsed.pathname;
      } catch {
        return null;
      }
      if (!pathname.startsWith(hubBase) && `${pathname}/` !== hubBase) return null;
      const rest = pathname.slice(hubBase.length).split('/');
      let scope: Scope = HUB_SCOPE;
      const first = rest[0] ?? '';
      if (first !== '' && !RESERVED_HUB_SEGMENTS.has(first) && SLUG.test(first)) {
        scope = toolScope(first);
        rest.shift();
      }
      let locale: Locale = DEFAULT_LOCALE;
      const maybeLocale = localeFromSegment(rest[0] ?? '');
      if (maybeLocale) {
        locale = maybeLocale;
        rest.shift();
      }
      const path = rest.join('/');
      return { scope, locale, path: path === '' ? '' : normalizePath(path) };
    }
  };
  return Object.freeze(topology);
}

/** Topologia de produção (ADR 0005): hub na raiz, ferramentas em `/<slug>/`. */
export const topology: Topology = createTopology({
  origin: NODUCT_ORIGIN,
  hubBase: NODUCT_HUB_BASE
});
