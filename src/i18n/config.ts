/*
 * Adaptador do hub sobre @noduct/tool-runtime. Locales, prefixos e base vêm do runtime (ADR 0005);
 * este módulo só preserva a API usada pelas páginas e testes do hub.
 */
import {
  DEFAULT_LOCALE,
  HUB_SCOPE,
  LOCALES,
  LOCALE_SEGMENT,
  isLocale as runtimeIsLocale,
  resolveBrowserLocale as runtimeResolveBrowserLocale,
  topology,
  type Locale as RuntimeLocale
} from '@noduct/tool-runtime';

export const locales = LOCALES;
export type Locale = RuntimeLocale;

export const defaultLocale: Locale = DEFAULT_LOCALE;
/** Base do hub sem a barra final (`''` com o hub na raiz). */
export const siteBasePath = topology.hubBase.replace(/\/$/, '');
export const localePrefixes: Record<Locale, string> = {
  en: '',
  'pt-BR': `/${LOCALE_SEGMENT['pt-BR']}`,
  es: `/${LOCALE_SEGMENT.es}`
};

export const isLocale = (value: string): value is Locale => runtimeIsLocale(value);
export const resolveBrowserLocale = (languages: readonly string[]): Locale => runtimeResolveBrowserLocale(languages);

/** Caminho da mesma página do hub em outro locale. Aceita caminhos com ou sem base e locale. */
export function localizePath(pathname: string, locale: Locale): string {
  const parsed = topology.parse(pathname.startsWith('/') ? pathname : `/${pathname}`);
  const path = parsed && parsed.scope.kind === 'hub' ? parsed.path : '';
  return topology.scopePath(HUB_SCOPE, path, locale);
}

/** Caminho de um arquivo público do hub (sem prefixo de locale). */
export function assetPath(pathname: string): string {
  const withoutBase = pathname.startsWith(topology.hubBase) ? pathname.slice(topology.hubBase.length) : pathname;
  return topology.hubAssetPath(withoutBase);
}
