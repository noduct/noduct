import type { Locale } from './locale';
import { topology as defaultTopology, type Alternate, type Scope, type Topology } from './topology';

/** Hreflang emitido para cada locale (`x-default` aponta para o inglês). */
export interface PageSeo {
  readonly canonical: string;
  readonly alternates: readonly Alternate[];
  readonly locale: Locale;
}

export function pageSeo(scope: Scope, path: string, locale: Locale, topology: Topology = defaultTopology): PageSeo {
  return {
    canonical: topology.canonical(scope, path, locale),
    alternates: topology.alternates(scope, path),
    locale
  };
}

/** Título completo da aba: "<título> | Noduct", sem repetir a marca. */
export function fullTitle(title: string): string {
  return title.includes('Noduct') ? title : `${title} | Noduct`;
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
}

export type JsonLdNode = Readonly<Record<string, unknown>>;

export function breadcrumbList(items: readonly BreadcrumbItem[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function softwareApplication(input: {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly locale: Locale;
}): JsonLdNode {
  return {
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.locale,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
}

export function organization(topology: Topology = defaultTopology): JsonLdNode {
  return { '@type': 'Organization', name: 'Noduct', url: topology.hubUrl() };
}

/** Um único bloco JSON-LD por página (`@graph`), como exige o contrato do shell. */
export function jsonLdGraph(nodes: readonly JsonLdNode[]): JsonLdNode {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
