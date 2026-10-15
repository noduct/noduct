import type { Placement, SponsorCampaign, SponsorshipRegistry } from '@/features/sponsorship';

export function placementFixture(overrides: Partial<Placement> = {}): Placement {
  return { id: 'merge-pdf.primary', toolId: 'merge-pdf', enabled: true, ...overrides };
}

export function campaignFixture(overrides: Partial<SponsorCampaign> = {}): SponsorCampaign {
  return {
    id: 'example-campaign',
    placementId: 'merge-pdf.primary',
    sponsorName: 'Example Sponsor',
    description: 'Synthetic sponsor used exclusively for automated tests.',
    destinationUrl: 'https://example.com/sponsor',
    logoUrl: 'https://example.com/sponsorship/logos/example-sponsor.webp',
    status: 'active',
    startsAt: '2030-01-01T00:00:00.000Z',
    expiresAt: '2030-02-01T00:00:00.000Z',
    ...overrides
  };
}

export function registryFixture(overrides: Partial<SponsorshipRegistry> = {}): SponsorshipRegistry {
  return {
    schemaVersion: 1,
    placements: [placementFixture()],
    campaigns: [campaignFixture()],
    ...overrides
  };
}
