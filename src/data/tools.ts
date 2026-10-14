import type { ToolDefinition, ToolCategory } from '@/types/tool';
import type { Locale } from '@/i18n/config';
import rawCatalog from './tools.json';
import ptBR from '@/i18n/catalog/pt-BR.json';
import es from '@/i18n/catalog/es.json';

interface RawToolItem {
  id: string;
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  category?: string;
  directoryUrl?: string;
  url?: string;
  status: ToolDefinition['status'];
  keywords?: string[];
  tags?: string[];
  icon?: string;
  featured?: boolean;
  visible?: boolean;
  sponsorPlacementId?: string;
}

type ToolTranslation = { name: string; description: string; keywords: string[] };
const localizedCatalogs: Partial<Record<Locale, Record<string, ToolTranslation>>> = { 'pt-BR': ptBR, es };

const buildTools = (locale: Locale): ToolDefinition[] => (rawCatalog as RawToolItem[]).map((item) => {
  const cat = (item.categoryId || item.category) as ToolCategory;
  const isAvailable = item.status === 'published' || item.status === 'beta' || item.status === 'ready';
  const resolvedUrl = isAvailable ? (item.url || item.directoryUrl) : item.url;
  const translation = localizedCatalogs[locale]?.[item.id];

  return {
    id: item.id,
    name: translation?.name ?? item.name,
    slug: item.slug || item.id,
    description: translation?.description ?? item.description,
    category: cat,
    categoryId: cat,
    keywords: translation?.keywords ?? item.keywords ?? item.tags ?? [],
    tags: item.tags || item.keywords || [],
    icon: item.icon || 'Wand2',
    url: resolvedUrl,
    directoryUrl: item.directoryUrl || `/tools/${item.id}/`,
    status: item.status || 'planned',
    featured: Boolean(item.featured),
    visible: item.visible !== false,
    sponsorPlacementId: item.sponsorPlacementId
  };
});

export const getLocalizedTools = (locale: Locale): ToolDefinition[] => buildTools(locale);
export const tools: ToolDefinition[] = buildTools('en');

export const visibleTools = tools.filter((tool) => tool.visible !== false);
export const publishedTools = tools.filter((tool) => (tool.status === 'published' || tool.status === 'ready') && tool.visible !== false);
export const featuredTools = publishedTools.filter((tool) => tool.featured);
export const toolsByCategory = (category: ToolDefinition['category'], includePlanned = false) =>
  tools.filter((tool) => tool.category === category && (includePlanned || tool.status !== 'planned') && tool.visible !== false);
export const getToolById = (id: string) => tools.find((tool) => tool.id === id);
