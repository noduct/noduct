import { describe, expect, it } from 'vitest';
import { tools } from '@/data/tools';
import { validateCatalog } from '@/lib/catalog';
describe('validateCatalog', () => {
  it('accepts the central catalog', () => expect(validateCatalog(tools)).toEqual([]));
  it('rejects duplicates and published tools without URLs', () => { const one = { ...tools[0]!, status: 'published' as const }; expect(validateCatalog([one, one])).toEqual(expect.arrayContaining([expect.stringContaining('Available tool has no URL'), expect.stringContaining('Duplicate tool id')])); });
});
