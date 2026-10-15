import { z } from 'zod';

// Canonical v1 contracts shared by the Hub and independently deployed tools.

const identifier = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const placementId = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/);
const hasControlCharacters = (value: string) =>
  Array.from(value).some(
    (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
  );
const plainText = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine(
      (value) => value === value.trim() && !/[<>]/u.test(value) && !hasControlCharacters(value),
      'Creative text must be plain text without markup or control characters'
    );
const httpsUrl = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        value.startsWith('https://') &&
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !/[\s\\]/u.test(value) &&
        !hasControlCharacters(value)
      );
    } catch {
      return false;
    }
  }, 'Sponsor URLs must use HTTPS without credentials, whitespace or backslashes');
const utcDate = z
  .string()
  .datetime()
  .refine((value) => Number.isFinite(Date.parse(value)), 'Dates must be valid UTC instants');

export const sponsorCampaignSchema = z
  .object({
    id: identifier,
    placementId,
    sponsorName: plainText(2, 50),
    description: plainText(10, 120),
    destinationUrl: httpsUrl,
    logoUrl: httpsUrl
      .refine((value) => {
        try {
          const url = new URL(value);
          return (
            /^\/sponsorship\/logos\/[a-z0-9]+(?:-[a-z0-9]+)*\.(png|webp)$/.test(url.pathname) &&
            !url.search &&
            !url.hash
          );
        } catch {
          return false;
        }
      }, 'Logos must be approved PNG/WebP assets under /sponsorship/logos/')
      .optional(),
    status: z.enum(['pending', 'active', 'paused', 'expired']),
    startsAt: utcDate,
    expiresAt: utcDate
  })
  .strict()
  .refine((campaign) => Date.parse(campaign.startsAt) < Date.parse(campaign.expiresAt), {
    message: 'Campaign startsAt must precede expiresAt',
    path: ['expiresAt']
  });

export const placementSchema = z
  .object({
    id: placementId,
    toolId: identifier,
    enabled: z.boolean()
  })
  .strict()
  .refine((placement) => placement.id.startsWith(`${placement.toolId}.`), {
    message: 'Placement ID must belong to its tool',
    path: ['id']
  });

export const sponsorshipRegistrySchema = z
  .object({
    schemaVersion: z.literal(1),
    placements: z.array(placementSchema),
    campaigns: z.array(sponsorCampaignSchema)
  })
  .strict()
  .superRefine((registry, context) => {
    const report = (path: (string | number)[], message: string) =>
      context.addIssue({ code: z.ZodIssueCode.custom, path, message });
    const placementIds = new Set<string>();
    const toolIds = new Set<string>();
    registry.placements.forEach((placement, index) => {
      if (placementIds.has(placement.id))
        report(['placements', index, 'id'], 'Duplicate placement ID');
      if (toolIds.has(placement.toolId))
        report(['placements', index, 'toolId'], 'Only one placement per tool is allowed');
      placementIds.add(placement.id);
      toolIds.add(placement.toolId);
    });
    const campaignIds = new Set<string>();
    registry.campaigns.forEach((campaign, index) => {
      if (campaignIds.has(campaign.id)) report(['campaigns', index, 'id'], 'Duplicate campaign ID');
      campaignIds.add(campaign.id);
      if (!placementIds.has(campaign.placementId))
        report(['campaigns', index, 'placementId'], 'Unknown placement');
      if (campaign.status !== 'active') return;
      const conflict = registry.campaigns
        .slice(0, index)
        .some(
          (other) =>
            other.status === 'active' &&
            other.placementId === campaign.placementId &&
            Date.parse(other.startsAt) < Date.parse(campaign.expiresAt) &&
            Date.parse(campaign.startsAt) < Date.parse(other.expiresAt)
        );
      if (conflict)
        report(['campaigns', index, 'placementId'], 'Overlapping active campaigns for placement');
    });
  });

export type SponsorCampaign = z.infer<typeof sponsorCampaignSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type SponsorshipRegistry = z.infer<typeof sponsorshipRegistrySchema>;

export function validateSponsorshipRegistry(input: unknown): string[] {
  const result = sponsorshipRegistrySchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.') || 'registry'}: ${issue.message}`);
}

export function isCampaignEligible(
  campaign: unknown,
  placement: unknown,
  now = new Date()
): boolean {
  const creative = sponsorCampaignSchema.safeParse(campaign);
  const slot = placementSchema.safeParse(placement);
  if (!creative.success || !slot.success || !Number.isFinite(now.getTime())) return false;
  return (
    slot.data.enabled &&
    creative.data.placementId === slot.data.id &&
    creative.data.status === 'active' &&
    Date.parse(creative.data.startsAt) <= now.getTime() &&
    now.getTime() < Date.parse(creative.data.expiresAt)
  );
}
