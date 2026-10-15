import { readFile } from 'node:fs/promises';
import { sponsorshipRegistrySchema } from '../src/features/sponsorship';

const registry = JSON.parse(
  await readFile(new URL('../dist/data/sponsorships.json', import.meta.url), 'utf8')
) as unknown;
const result = sponsorshipRegistrySchema.safeParse(registry);
if (!result.success) {
  console.error(
    result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n')
  );
  process.exit(1);
}
console.log(
  `Public sponsorship registry v${result.data.schemaVersion} valid: ${result.data.campaigns.length} campaigns.`
);
