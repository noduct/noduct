import type { CategoryId } from '@noduct/tool-runtime';
import type { IconName } from './registry';

export const categoryIcon = {
  'pdf-tools': 'file-text',
  'image-tools': 'image',
  'text-tools': 'type',
  'data-tools': 'database',
  'developer-tools': 'code-2',
  'general-utilities': 'wrench'
} as const satisfies Record<CategoryId, IconName>;
