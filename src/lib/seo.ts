import { siteConfig } from '@/config/site';
import { localizePath } from '@/i18n/config';

export interface SeoMetadata {
  title: string;
  fullTitle: string;
  description: string;
  canonical: URL;
  image: URL;
  noindex: boolean;
}

export function createSeoMetadata(pathname: string, title: string, description: string, image: string, noindex = false): SeoMetadata {
  return {
    title,
    fullTitle: title.includes('Tolvira') ? title : `${title} | Tolvira`,
    description,
    canonical: new URL(localizePath(pathname, 'en'), siteConfig.url),
    image: new URL(localizePath(image, 'en'), siteConfig.url),
    noindex
  };
}
