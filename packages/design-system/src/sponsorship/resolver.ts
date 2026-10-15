import { isCampaignEligible, sponsorshipRegistrySchema, type SponsorCampaign } from './contracts';

export function resolveCampaign(
  registry: unknown,
  placementId: string,
  now = new Date()
): SponsorCampaign | undefined {
  const result = sponsorshipRegistrySchema.safeParse(registry);
  if (!result.success || !Number.isFinite(now.getTime())) return undefined;
  const placement = result.data.placements.find((candidate) => candidate.id === placementId);
  if (!placement) return undefined;
  return result.data.campaigns.find((campaign) => isCampaignEligible(campaign, placement, now));
}
