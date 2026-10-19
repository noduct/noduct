import {
  categoryPath,
  getCategory,
  breadcrumbList,
  jsonLdGraph,
  softwareApplication,
  topology,
  type BreadcrumbItem,
  type Locale,
  type ToolManifest
} from '@noduct/tool-runtime';
import { getShellMessages } from './messages';

/** The visible breadcrumb and its JSON-LD use this exact list. */
export function toolBreadcrumbItems(
  tool: ToolManifest,
  locale: Locale,
  heading: string
): readonly [BreadcrumbItem, BreadcrumbItem, BreadcrumbItem] {
  return [
    { name: getShellMessages(locale).nav.breadcrumbHome, url: topology.hubUrl('', locale) },
    {
      name: getCategory(tool.category, locale).name,
      url: topology.hubUrl(categoryPath(tool.category), locale)
    },
    { name: heading, url: topology.canonical(tool.scope, '', locale) }
  ];
}

export function toolJsonLd(
  tool: ToolManifest,
  locale: Locale,
  content: { name: string; description: string }
) {
  return jsonLdGraph([
    softwareApplication({
      name: content.name,
      description: content.description,
      url: topology.canonical(tool.scope, '', locale),
      locale
    }),
    breadcrumbList(toolBreadcrumbItems(tool, locale, content.name))
  ]);
}
