import { describe, expect, it } from 'vitest';
import { activeSponsorFor, validateSponsorships } from '@/lib/sponsorships';
import type { Sponsorship } from '@/types/sponsorship';
const active: Sponsorship = { id: 'acme', placementId: 'merge-primary', sponsorName: 'Acme Software', description: 'Useful software for focused teams.', destinationUrl: 'https://example.com', status: 'active', expiresAt: '2030-01-01T00:00:00.000Z' };
describe('sponsorship configuration', () => {
  it('returns a current active placement', () => expect(activeSponsorFor([active], 'merge-primary', new Date('2029-01-01'))).toEqual(active));
  it('blocks expired active creative and insecure URLs', () => { const errors = validateSponsorships([{ ...active, destinationUrl: 'http://example.com' }], new Date('2031-01-01')); expect(errors.join(' ')).toMatch(/HTTPS/); expect(errors.join(' ')).toMatch(/expired/); });
});
