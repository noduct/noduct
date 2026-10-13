import { z } from 'zod';
import type { Sponsorship } from '@/types/sponsorship';

const schema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  placementId: z.string().min(1).max(80),
  sponsorName: z.string().min(2).max(50),
  description: z.string().min(10).max(120),
  destinationUrl: z.string().url().refine((url) => url.startsWith('https://'), 'Sponsor URLs must use HTTPS'),
  logoUrl: z.string().url().optional(),
  status: z.enum(['pending', 'active', 'paused', 'expired']),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
});

export function validateSponsorships(items: Sponsorship[], now = new Date()): string[] {
  const errors: string[] = [];
  const placements = new Set<string>();
  for (const item of items) {
    const result = schema.safeParse(item);
    if (!result.success) errors.push(`${item.id}: ${result.error.issues.map((issue) => issue.message).join(', ')}`);
    if (item.status === 'active' && item.expiresAt && new Date(item.expiresAt) <= now) errors.push(`Active sponsorship is expired: ${item.id}`);
    if (item.status === 'active' && placements.has(item.placementId)) errors.push(`Multiple active sponsors for placement: ${item.placementId}`);
    if (item.status === 'active') placements.add(item.placementId);
  }
  return errors;
}

export const activeSponsorFor = (items: Sponsorship[], placementId: string, now = new Date()) =>
  items.find((item) => item.placementId === placementId && item.status === 'active' && (!item.startsAt || new Date(item.startsAt) <= now) && (!item.expiresAt || new Date(item.expiresAt) > now));
