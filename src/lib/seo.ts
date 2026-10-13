import { siteConfig } from '@/config/site';

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
    canonical: new URL(pathname, siteConfig.url),
    image: new URL(image, siteConfig.url),
    noindex
  };
}
