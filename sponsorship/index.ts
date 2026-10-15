import type { SponsorshipRegistry } from '../src/features/sponsorship';
import { campaigns } from './campaigns';
import { placements } from './placements';

export const sponsorshipRegistry: SponsorshipRegistry = { schemaVersion: 1, placements, campaigns };
