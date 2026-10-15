import { describe, expect, it } from 'vitest';
import { activeSponsorFor, validateSponsorships } from '@/lib/sponsorships';
import type { Sponsorship } from '@/types/sponsorship';
import { sponsorshipRegistry } from '../../sponsorship';
import { validateSponsorshipRegistry } from '@/features/sponsorship';
const active: Sponsorship = {
  id: 'acme',
  placementId: 'merge-pdf.primary',
  sponsorName: 'Acme Software',
  description: 'Useful software for focused teams.',
  destinationUrl: 'https://example.com',
  status: 'active',
  startsAt: '2029-01-01T00:00:00.000Z',
  expiresAt: '2030-01-01T00:00:00.000Z'
};
describe('sponsorship configuration', () => {
  it('validates the administrative registry derived from the catalog', () => {
    expect(validateSponsorshipRegistry(sponsorshipRegistry)).toEqual([]);
    expect(sponsorshipRegistry.schemaVersion).toBe(1);
    expect(
      sponsorshipRegistry.placements.find((slot) => slot.id === 'merge-pdf.primary')?.enabled
    ).toBe(false);
  });
  it('keeps planned tool placements disabled', () =>
    expect(
      activeSponsorFor([active], 'merge-pdf.primary', new Date('2029-01-01'))
    ).toBeUndefined());
  it('blocks insecure URLs', () =>
    expect(
      validateSponsorships([{ ...active, destinationUrl: 'http://example.com' }]).join(' ')
    ).toMatch(/HTTPS/));
  it('blocks expired active creative', () =>
    expect(validateSponsorships([active], new Date('2031-01-01')).join(' ')).toMatch(/expired/));
  it('accepts an empty campaign list', () => expect(validateSponsorships([])).toEqual([]));
  it('fails closed for malformed inputs', () =>
    expect(activeSponsorFor(null, 'merge-pdf.primary')).toBeUndefined());
});
