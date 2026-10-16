import { describe, expect, it } from 'vitest';
import { tools } from '@/data/tools';
import { validateCatalog } from '@/lib/catalog';
import { topology } from '@noduct/tool-runtime';
describe('validateCatalog', () => {
  it('derives available tool URLs from the topology', () => {
    const one = { ...tools[0]!, status: 'published' as const, url: topology.toolUrl(tools[0]!.slug) };
    expect(validateCatalog([one])).toEqual([]);
    expect(validateCatalog([{ ...one, url: 'https://example.test/x/' }])).toEqual([expect.stringContaining('topology')]);
  });
  it('rejects reserved slugs and operational URLs on planned tools', () => {
    const planned = tools[0]!;
    expect(validateCatalog([{ ...planned, slug: 'about' }])).toEqual(expect.arrayContaining([expect.stringContaining('reserved')]));
    expect(validateCatalog([{ ...planned, url: topology.toolUrl(planned.slug) }])).toEqual(expect.arrayContaining([expect.stringContaining('Planned tool')]));
  });
  it('accepts the central catalog', () => expect(validateCatalog(tools)).toEqual([]));
  it('rejects duplicates and published tools without URLs', () => { const one = { ...tools[0]!, status: 'published' as const }; expect(validateCatalog([one, one])).toEqual(expect.arrayContaining([expect.stringContaining('Available tool has no URL'), expect.stringContaining('Duplicate tool id')])); });
});
