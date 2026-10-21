import { fullTitle, HUB_SCOPE, pageSeo, topology } from '@noduct/tool-runtime';
import type { Locale } from '@/i18n/config';

export interface SeoMetadata {
  title: string;
  fullTitle: string;
  description: string;
  canonical: URL;
  image: URL;
  noindex: boolean;
}

export function createSeoMetadata(
  pathname: string,
  title: string,
  description: string,
  image: string,
  noindex = false,
  locale: Locale = 'en'
): SeoMetadata {
  const parsed = topology.parse(pathname.startsWith('/') ? pathname : `/${pathname}`);
  const path = parsed?.scope.kind === 'hub' ? parsed.path : '';
  return {
    title,
    fullTitle: fullTitle(title),
    description,
    canonical: new URL(pageSeo(HUB_SCOPE, path, locale).canonical),
    image: new URL(topology.hubAssetUrl(image.replace(/^\/+/, ''))),
    noindex
  };
}
