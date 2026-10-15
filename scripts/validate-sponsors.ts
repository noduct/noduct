import { sponsorshipRegistry } from '../sponsorship';
import { validateSponsorshipRegistry } from '../src/features/sponsorship';
import { validateSponsorships } from '../src/lib/sponsorships';
const errors = validateSponsorshipRegistry(sponsorshipRegistry);
if (!errors.length) errors.push(...validateSponsorships(sponsorshipRegistry.campaigns));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Sponsorship registry v${sponsorshipRegistry.schemaVersion} valid: ${sponsorshipRegistry.campaigns.length} public campaigns.`
);
