import { sponsorshipRegistrySchema, type SponsorshipRegistry } from './index';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Administrative inputs may grow; only these reviewed fields can become public.
function pickFields(value: unknown, fields: readonly string[]): unknown {
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    fields.filter((field) => Object.hasOwn(value, field)).map((field) => [field, value[field]])
  );
}

export function projectPublicRegistry(input: unknown, now = new Date()): SponsorshipRegistry {
  if (!Number.isFinite(now.getTime()))
    throw new Error('Registry generation requires a valid clock');
  if (!isRecord(input)) throw new Error('Registry source must be an object');
  const placements = Array.isArray(input.placements)
    ? input.placements.map((placement) => pickFields(placement, ['id', 'toolId', 'enabled']))
    : input.placements;
  const campaigns = Array.isArray(input.campaigns)
    ? input.campaigns.map((campaign) =>
        pickFields(campaign, [
          'id',
          'placementId',
          'sponsorName',
          'description',
          'destinationUrl',
          'logoUrl',
          'status',
          'startsAt',
          'expiresAt'
        ])
      )
    : input.campaigns;
  // Validate before filtering: an invalid administrative record must fail the build.
  const registry = sponsorshipRegistrySchema.parse({
    schemaVersion: input.schemaVersion,
    placements,
    campaigns
  });
  return {
    schemaVersion: 1,
    placements: registry.placements,
    campaigns: registry.campaigns.filter(
      (campaign) => campaign.status === 'active' && Date.parse(campaign.expiresAt) > now.getTime()
    )
  };
}
