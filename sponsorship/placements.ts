import { tools } from '../src/data/tools';
import type { Placement } from '../src/features/sponsorship';

// Catalog availability controls eligibility; planned tools remain disabled.
export const placements: Placement[] = tools.map((tool) => ({
  id: `${tool.id}.primary`,
  toolId: tool.id,
  enabled: tool.visible !== false && tool.status !== 'planned'
}));
