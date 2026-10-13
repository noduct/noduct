import { z } from 'zod';
import { categoryIds, type ToolDefinition } from '@/types/tool';

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const schema = z.object({
  id: z.string().regex(slug),
  name: z.string().min(2).max(60),
  slug: z.string().regex(slug),
  description: z.string().min(20).max(160),
  category: z.enum(categoryIds),
  keywords: z.array(z.string().min(1)).min(1),
  icon: z.string().min(1),
  url: z.string().url().optional(),
  repositoryUrl: z.string().url().optional(),
  status: z.enum(['planned', 'beta', 'published']),
  featured: z.boolean(),
  sponsorPlacementId: z.string().optional()
});

export function validateCatalog(items: ToolDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of items) {
    const result = schema.safeParse(item);
    if (!result.success) errors.push(`${item.id || '(unknown)'}: ${result.error.issues.map((issue) => issue.message).join(', ')}`);
    if (ids.has(item.id)) errors.push(`Duplicate tool id: ${item.id}`);
    if (slugs.has(item.slug)) errors.push(`Duplicate tool slug: ${item.slug}`);
    if (item.status !== 'planned' && !item.url) errors.push(`Available tool has no URL: ${item.id}`);
    if (item.featured && item.status !== 'published') errors.push(`Only published tools may be featured: ${item.id}`);
    ids.add(item.id);
    slugs.add(item.slug);
  }
  return errors;
}
