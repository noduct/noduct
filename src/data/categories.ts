import { getCategories } from '@noduct/tool-runtime';
import type { CategoryDefinition } from '@/types/tool';
import type { Locale } from '@/i18n/config';

/* Adaptador: nomes e descrições das categorias vêm da taxonomia de @noduct/tool-runtime. */
export const getLocalizedCategories = (locale: Locale): CategoryDefinition[] =>
  [...getCategories(locale)];
export const categories = getLocalizedCategories('en');

export const getCategory = (id: string, locale: Locale = 'en') =>
  getLocalizedCategories(locale).find((category) => category.id === id);
