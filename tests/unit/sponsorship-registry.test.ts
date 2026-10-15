import { describe, expect, it } from 'vitest';
import { projectPublicRegistry } from '@/features/sponsorship/registry';
import { campaignFixture, placementFixture, registryFixture } from '../fixtures/sponsorship';

const now = new Date('2030-01-15T00:00:00Z');

describe('public registry projection', () => {
  it('exports reviewed fields only at every level', () => {
    const input = {
      ...registryFixture(),
      privateNotes: 'DO_NOT_PUBLISH',
      placements: [{ ...placementFixture(), internalNotes: 'DO_NOT_PUBLISH' }],
      campaigns: [
        { ...campaignFixture(), contactEmail: 'DO_NOT_PUBLISH', billing: 'DO_NOT_PUBLISH' }
      ]
    };
    const output = projectPublicRegistry(input, now);
    expect(output).toEqual(registryFixture());
    expect(JSON.stringify(output)).not.toContain('DO_NOT_PUBLISH');
  });
  it('keeps scheduled approved campaigns but removes expired and inactive records', () => {
    const source = registryFixture({
      campaigns: [
        campaignFixture({
          id: 'expired',
          startsAt: '2029-01-01T00:00:00Z',
          expiresAt: '2030-01-15T00:00:00Z'
        }),
        campaignFixture({
          id: 'future',
          startsAt: '2030-02-01T00:00:00Z',
          expiresAt: '2030-03-01T00:00:00Z'
        }),
        campaignFixture({ id: 'paused', status: 'paused' }),
        campaignFixture({ id: 'pending', status: 'pending' }),
        campaignFixture({ id: 'ended', status: 'expired' })
      ]
    });
    expect(projectPublicRegistry(source, now).campaigns.map((campaign) => campaign.id)).toEqual([
      'future'
    ]);
  });
  it('allows a valid empty registry', () => {
    expect(projectPublicRegistry(registryFixture({ campaigns: [] }), now).campaigns).toEqual([]);
  });
  it.each([null, [], {}, { schemaVersion: 2, placements: [], campaigns: [] }])(
    'rejects invalid source %j',
    (source) => {
      expect(() => projectPublicRegistry(source, now)).toThrow();
    }
  );
  it('validates before filtering so malformed inactive records cannot silently pass the build', () => {
    expect(() =>
      projectPublicRegistry(
        registryFixture({
          campaigns: [campaignFixture({ status: 'paused', destinationUrl: 'javascript:alert(1)' })]
        }),
        now
      )
    ).toThrow();
  });
  it('blocks overlapping approved campaigns at publication', () => {
    expect(() =>
      projectPublicRegistry(
        registryFixture({ campaigns: [campaignFixture(), campaignFixture({ id: 'conflict' })] }),
        now
      )
    ).toThrow();
  });
  it('rejects an invalid build clock', () => {
    expect(() => projectPublicRegistry(registryFixture(), new Date('invalid'))).toThrow();
  });
});
