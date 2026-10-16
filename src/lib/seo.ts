import { siteConfig } from '@/config/site';
import { assetPath, localizePath, type Locale } from '@/i18n/config';

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
  return {
    title,
    fullTitle: title.includes('Noduct') ? title : `${title} | Noduct`,
    description,
    canonical: new URL(localizePath(pathname, locale), siteConfig.url),
    image: new URL(assetPath(image), siteConfig.url),
    noindex
  };
}
