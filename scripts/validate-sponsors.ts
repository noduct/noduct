import { sponsorships } from '../src/data/sponsorships';
import { validateSponsorships } from '../src/lib/sponsorships';
const errors = validateSponsorships(sponsorships);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Sponsorship configuration valid: ${sponsorships.length} public records.`);
