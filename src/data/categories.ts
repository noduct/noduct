import { getCategories } from '@noduct/tool-runtime';
import type { CategoryDefinition, ToolCategory } from '@/types/tool';
import type { Locale } from '@/i18n/config';

/* Adaptador: nomes e descrições das categorias vêm da taxonomia de @noduct/tool-runtime. */
const icons: Record<ToolCategory, string> = {
  'pdf-tools': 'FileText',
  'image-tools': 'Image',
  'text-tools': 'Type',
  'data-tools': 'Table',
  'developer-tools': 'Code2',
  'general-utilities': 'Wrench'
};

export const getLocalizedCategories = (locale: Locale): CategoryDefinition[] =>
  getCategories(locale).map((category) => ({ ...category, icon: icons[category.id] }));
export const categories = getLocalizedCategories('en');

export const getCategory = (id: string, locale: Locale = 'en') =>
  getLocalizedCategories(locale).find((category) => category.id === id);
