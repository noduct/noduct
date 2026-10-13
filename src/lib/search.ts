import type { ToolDefinition } from '@/types/tool';

const normalize = (value: string) =>
  value.normalize('NFKD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function searchTools(items: ToolDefinition[], query: string): ToolDefinition[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items
    .map((tool) => {
      const name = normalize(tool.name);
      const haystack = normalize(`${tool.name} ${tool.description} ${tool.keywords.join(' ')}`);
      const matched = terms.every((term) => haystack.includes(term));
      const keywords = tool.keywords.map(normalize);
      const score = terms.reduce((sum, term) => sum + (name.startsWith(term) ? 4 : name.includes(term) ? 3 : keywords.includes(term) ? 2 : haystack.includes(term) ? 1 : 0), 0);
      return { tool, matched, score };
    })
    .filter(({ matched }) => matched)
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .map(({ tool }) => tool);
}
