import { describe, expect, it } from 'vitest';
import {
  isCampaignEligible,
  placementSchema,
  sponsorCampaignSchema,
  sponsorshipRegistrySchema,
  validateSponsorshipRegistry
} from '@/features/sponsorship';
import { campaignFixture, placementFixture, registryFixture } from '../fixtures/sponsorship';

describe('sponsorship foundation contracts', () => {
  it('accepts a synthetic registry and a campaign without an optional logo', () => {
    expect(sponsorshipRegistrySchema.safeParse(registryFixture()).success).toBe(true);
    expect(validateSponsorshipRegistry(registryFixture())).toEqual([]);
    const withoutLogo = campaignFixture();
    Reflect.deleteProperty(withoutLogo, 'logoUrl');
    expect(sponsorCampaignSchema.safeParse(withoutLogo).success).toBe(true);
    expect(validateSponsorshipRegistry(registryFixture({ placements: [], campaigns: [] }))).toEqual(
      []
    );
  });

  it.each([null, undefined, [], 'campaign', 1, true, {}])(
    'rejects malformed input %j without throwing',
    (input) => {
      expect(sponsorCampaignSchema.safeParse(input).success).toBe(false);
      expect(placementSchema.safeParse(input).success).toBe(false);
      expect(sponsorshipRegistrySchema.safeParse(input).success).toBe(false);
      expect(validateSponsorshipRegistry(input).length).toBeGreaterThan(0);
    }
  );

  it.each(['contactEmail', 'billingDetails', 'html', 'css', 'javascript', 'svg'])(
    'rejects unsupported creative or private field %s',
    (field) => {
      expect(
        sponsorCampaignSchema.safeParse({ ...campaignFixture(), [field]: 'untrusted' }).success
      ).toBe(false);
      expect(
        placementSchema.safeParse({ ...placementFixture(), [field]: 'untrusted' }).success
      ).toBe(false);
      expect(
        validateSponsorshipRegistry({ ...registryFixture(), [field]: 'untrusted' }).length
      ).toBeGreaterThan(0);
    }
  );

  it.each([0, 2, '1', null])('rejects unsupported registry version %j', (schemaVersion) => {
    expect(
      validateSponsorshipRegistry({ ...registryFixture(), schemaVersion }).length
    ).toBeGreaterThan(0);
  });

  it.each(['Invalid ID', '-campaign', 'campaign-', 'campaign--id', 'a'.repeat(81)])(
    'rejects invalid campaign id %s',
    (id) => {
      expect(sponsorCampaignSchema.safeParse(campaignFixture({ id })).success).toBe(false);
    }
  );

  it.each([
    'merge-primary',
    'merge-pdf.',
    '.primary',
    'merge-pdf.primary.extra',
    'Merge.primary',
    `${'a'.repeat(74)}.primary`
  ])('rejects invalid placement id %s', (id) => {
    expect(placementSchema.safeParse(placementFixture({ id })).success).toBe(false);
    expect(sponsorCampaignSchema.safeParse(campaignFixture({ placementId: id })).success).toBe(
      false
    );
  });

  it('requires a valid tool identifier and an explicit boolean enabled flag', () => {
    expect(placementSchema.safeParse(placementFixture({ toolId: 'Merge PDF' })).success).toBe(
      false
    );
    expect(placementSchema.safeParse(placementFixture({ toolId: 'split-pdf' })).success).toBe(
      false
    );
    expect(placementSchema.safeParse({ ...placementFixture(), enabled: 'true' }).success).toBe(
      false
    );
    const withoutEnabled = placementFixture();
    Reflect.deleteProperty(withoutEnabled, 'enabled');
    expect(placementSchema.safeParse(withoutEnabled).success).toBe(false);
  });

  it.each([
    { sponsorName: 'x' },
    { sponsorName: 'x'.repeat(51) },
    { sponsorName: '<b>Example</b>' },
    { description: 'Too short' },
    { description: 'x'.repeat(121) },
    { description: '<script>alert(1)</script>' },
    { description: '<svg onload="alert(1)"></svg>' }
  ])('rejects out-of-bounds or markup creative %j', (overrides) => {
    expect(sponsorCampaignSchema.safeParse(campaignFixture(overrides)).success).toBe(false);
  });

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'data:image/svg+xml,test',
    'https://user:password@example.com',
    'https://example.com/has space',
    'https://example.com/has\nnewline',
    'https://example.com/has\u0000control',
    'https://example.com\\path',
    '//example.com'
  ])('rejects unsafe destination URL %j', (destinationUrl) => {
    expect(sponsorCampaignSchema.safeParse(campaignFixture({ destinationUrl })).success).toBe(
      false
    );
  });

  it.each([
    'not-a-url',
    'http://example.com/sponsorship/logos/example.png',
    'https://example.com/sponsorship/logos/example.svg',
    'https://example.com/sponsorship/logos/example.jpg',
    'https://example.com/other/example.png',
    'https://example.com/sponsorship/logos/nested/example.png',
    'https://example.com/sponsorship/logos/Example.png',
    'https://example.com/sponsorship/logos/example.png?version=1',
    'https://example.com/sponsorship/logos/example.png#fragment',
    'https://user:password@example.com/sponsorship/logos/example.png'
  ])('rejects unsupported logo URL %s', (logoUrl) => {
    expect(sponsorCampaignSchema.safeParse(campaignFixture({ logoUrl })).success).toBe(false);
  });

  it.each(['png', 'webp'])('accepts the supported %s logo format', (extension) => {
    expect(
      sponsorCampaignSchema.safeParse(
        campaignFixture({ logoUrl: `https://example.com/sponsorship/logos/example.${extension}` })
      ).success
    ).toBe(true);
  });

  it.each([
    '2030-01-01',
    '2030-01-01T00:00:00',
    '2030-01-01T00:00:00+00:00',
    '2030-02-30T00:00:00Z',
    'not-a-date',
    'Infinity'
  ])('rejects invalid or non-UTC date %s', (date) => {
    expect(sponsorCampaignSchema.safeParse(campaignFixture({ startsAt: date })).success).toBe(
      false
    );
    expect(sponsorCampaignSchema.safeParse(campaignFixture({ expiresAt: date })).success).toBe(
      false
    );
  });

  it('requires both dates and a strictly increasing interval', () => {
    const campaign = campaignFixture();
    const withoutStart = { ...campaign };
    const withoutEnd = { ...campaign };
    Reflect.deleteProperty(withoutStart, 'startsAt');
    Reflect.deleteProperty(withoutEnd, 'expiresAt');
    expect(sponsorCampaignSchema.safeParse(withoutStart).success).toBe(false);
    expect(sponsorCampaignSchema.safeParse(withoutEnd).success).toBe(false);
    expect(
      sponsorCampaignSchema.safeParse({ ...campaign, expiresAt: campaign.startsAt }).success
    ).toBe(false);
    expect(
      sponsorCampaignSchema.safeParse({ ...campaign, expiresAt: '2029-12-31T23:59:59Z' }).success
    ).toBe(false);
  });

  it('rejects unknown campaign status', () => {
    expect(
      sponsorCampaignSchema.safeParse({ ...campaignFixture(), status: 'published' }).success
    ).toBe(false);
  });
});

describe('sponsorship registry consistency', () => {
  it('rejects duplicate campaign identifiers even when the intervals do not overlap', () => {
    expect(
      validateSponsorshipRegistry(
        registryFixture({
          campaigns: [
            campaignFixture(),
            campaignFixture({ startsAt: '2030-02-01T00:00:00Z', expiresAt: '2030-03-01T00:00:00Z' })
          ]
        })
      ).length
    ).toBeGreaterThan(0);
  });

  it('rejects duplicate placement identifiers and tool assignments', () => {
    expect(
      validateSponsorshipRegistry(
        registryFixture({
          placements: [placementFixture(), placementFixture()]
        })
      ).length
    ).toBeGreaterThan(0);
    expect(
      validateSponsorshipRegistry(
        registryFixture({
          placements: [placementFixture(), placementFixture({ id: 'merge-pdf.secondary' })]
        })
      ).length
    ).toBeGreaterThan(0);
  });

  it('rejects a campaign referencing an unknown placement', () => {
    expect(
      validateSponsorshipRegistry(
        registryFixture({ campaigns: [campaignFixture({ placementId: 'other-tool.primary' })] })
      ).length
    ).toBeGreaterThan(0);
  });

  it.each([
    ['2030-01-01T00:00:00Z', '2030-02-01T00:00:00Z'],
    ['2030-01-15T00:00:00Z', '2030-03-01T00:00:00Z'],
    ['2029-12-01T00:00:00Z', '2030-01-15T00:00:00Z'],
    ['2030-01-10T00:00:00Z', '2030-01-20T00:00:00Z'],
    ['2029-12-01T00:00:00Z', '2030-03-01T00:00:00Z']
  ])(
    'rejects overlapping active intervals %s to %s, regardless of input order',
    (startsAt, expiresAt) => {
      const campaigns = [
        campaignFixture(),
        campaignFixture({ id: 'second-campaign', startsAt, expiresAt })
      ];
      expect(validateSponsorshipRegistry(registryFixture({ campaigns })).length).toBeGreaterThan(0);
      expect(
        validateSponsorshipRegistry(registryFixture({ campaigns: [...campaigns].reverse() })).length
      ).toBeGreaterThan(0);
    }
  );

  it('accepts adjacent active campaigns without an overlap', () => {
    expect(
      validateSponsorshipRegistry(
        registryFixture({
          campaigns: [
            campaignFixture(),
            campaignFixture({
              id: 'next-campaign',
              startsAt: '2030-02-01T00:00:00Z',
              expiresAt: '2030-03-01T00:00:00Z'
            })
          ]
        })
      )
    ).toEqual([]);
  });

  it.each(['pending', 'paused', 'expired'] as const)(
    'does not reserve a conflicting active interval for a %s campaign',
    (status) => {
      expect(
        validateSponsorshipRegistry(
          registryFixture({
            campaigns: [campaignFixture(), campaignFixture({ id: 'inactive-campaign', status })]
          })
        )
      ).toEqual([]);
    }
  );

  it('allows simultaneous campaigns for different placements', () => {
    expect(
      validateSponsorshipRegistry(
        registryFixture({
          placements: [
            placementFixture(),
            placementFixture({ id: 'split-pdf.primary', toolId: 'split-pdf' })
          ],
          campaigns: [
            campaignFixture(),
            campaignFixture({ id: 'other-campaign', placementId: 'split-pdf.primary' })
          ]
        })
      )
    ).toEqual([]);
  });
});

describe('campaign eligibility', () => {
  const now = new Date('2030-01-15T00:00:00Z');

  it.each([
    ['2029-12-31T23:59:59.999Z', false],
    ['2030-01-01T00:00:00.000Z', true],
    ['2030-01-31T23:59:59.999Z', true],
    ['2030-02-01T00:00:00.000Z', false],
    ['2030-02-01T00:00:00.001Z', false]
  ])('evaluates the half-open campaign interval at %s', (date, expected) => {
    expect(isCampaignEligible(campaignFixture(), placementFixture(), new Date(date))).toBe(
      expected
    );
  });

  it.each(['pending', 'paused', 'expired'] as const)('never renders a %s campaign', (status) => {
    expect(isCampaignEligible(campaignFixture({ status }), placementFixture(), now)).toBe(false);
  });

  it('requires an enabled matching placement', () => {
    expect(isCampaignEligible(campaignFixture(), placementFixture({ enabled: false }), now)).toBe(
      false
    );
    expect(
      isCampaignEligible(
        campaignFixture(),
        placementFixture({ id: 'split-pdf.primary', toolId: 'split-pdf' }),
        now
      )
    ).toBe(false);
  });

  it.each([null, undefined, [], 'invalid', {}])('fails closed for malformed input %j', (input) => {
    expect(isCampaignEligible(input, placementFixture(), now)).toBe(false);
    expect(isCampaignEligible(campaignFixture(), input, now)).toBe(false);
  });

  it('fails closed for invalid dates and unsafe creative', () => {
    expect(isCampaignEligible(campaignFixture(), placementFixture(), new Date('invalid'))).toBe(
      false
    );
    expect(
      isCampaignEligible(
        campaignFixture({ destinationUrl: 'javascript:alert(1)' }),
        placementFixture(),
        now
      )
    ).toBe(false);
    expect(
      isCampaignEligible(
        { ...campaignFixture(), html: '<script>alert(1)</script>' },
        placementFixture(),
        now
      )
    ).toBe(false);
  });
});
