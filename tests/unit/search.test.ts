import { describe, expect, it } from 'vitest';
import { searchTools } from '@/lib/search';
import { tools } from '@/data/tools';
describe('searchTools', () => {
  it('matches name, description and keywords', () => { expect(searchTools(tools, 'pdf combine')[0]?.name).toBe('Merge PDF'); expect(searchTools(tools, 'epoch')[0]?.name).toBe('Unix Timestamp Converter'); });
  it('is case insensitive and handles empty input', () => { expect(searchTools(tools, 'JSON FORMATTER')[0]?.name).toBe('JSON Formatter'); expect(searchTools(tools, '')).toHaveLength(tools.length); });
  it('returns no result for unrelated input', () => expect(searchTools(tools, 'unfindable-zebra')).toEqual([]));
});
