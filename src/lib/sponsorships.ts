import { placements } from '../../sponsorship/placements';
import { sponsorshipRegistrySchema } from '../features/sponsorship';
import { resolveCampaign } from '../../packages/design-system/src/sponsorship/resolver';

export function validateSponsorships(items: unknown, now = new Date()): string[] {
  const result = sponsorshipRegistrySchema.safeParse({
    schemaVersion: 1,
    placements,
    campaigns: items
  });
  if (!result.success)
    return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  const errors: string[] = [];
  for (const campaign of result.data.campaigns) {
    if (campaign.status === 'active' && Date.parse(campaign.expiresAt) <= now.getTime())
      errors.push(`Active sponsorship is expired: ${campaign.id}`);
  }
  return errors;
}

export function activeSponsorFor(items: unknown, placementId: string, now = new Date()) {
  return resolveCampaign(
    {
      schemaVersion: 1,
      placements,
      campaigns: items
    },
    placementId,
    now
  );
}
