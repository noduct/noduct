import { describe, expect, it } from 'vitest';
import { skillViolations, unindexedDocuments } from '../../scripts/check-agents.ts';
import { boundariesMarkdown, syncArchitectureDoc } from '../../scripts/validate-architecture.ts';
import { toolAgentsMarkdown } from '../../scripts/cli/new-tool.ts';
import { localAgentViolations } from '../../scripts/check-agents.ts';

const skill = '---\nname: noduct-sample\ndescription: Use ao testar.\n---\n\n# Sample\n';
const rootAgents = '| Sample | [noduct-sample](.agents/skills/noduct-sample/SKILL.md) |';
const mirrors = (content: string): Array<[string, string]> =>
  ['.claude', '.github', '.gemini'].map((dir) => [`${dir}/skills/noduct-sample/SKILL.md`, content]);

describe('skills do projeto', () => {
  it('aceita fonte indexada com cópias idênticas', () => {
    const files = new Map([['.agents/skills/noduct-sample/SKILL.md', skill], ...mirrors(skill)]);
    expect(skillViolations(files, rootAgents)).toEqual([]);
  });

  it('acusa cópia divergente, skill fora do índice e name diferente da pasta', () => {
    const wrongName = skill.replace('name: noduct-sample', 'name: other');
    const files = new Map([
      ['.agents/skills/noduct-sample/SKILL.md', wrongName],
      ...mirrors(wrongName).slice(1),
      ['.claude/skills/noduct-sample/SKILL.md', 'editado à mão']
    ]);
    const reasons = skillViolations(files, '').map((error) => error.reason);
    expect(reasons).toContain('Skill sem name igual à pasta ou sem description.');
    expect(reasons).toContain('Skill fora do índice do AGENTS.md; agentes nem sempre a invocam sozinhos.');
    expect(reasons).toContain('Cópia de skill ausente ou divergente da fonte.');
  });

  it('acusa cópia sem fonte', () => {
    const files = new Map(mirrors(skill));
    expect(skillViolations(files, rootAgents).map((error) => error.path)).toEqual(
      mirrors(skill).map(([path]) => path)
    );
  });
});

describe('índice de documentos', () => {
  const sources: Record<string, string> = {
    'docs/README.md': '[ADRs](adr/README.md) · [Guia](guia.md)',
    'docs/adr/README.md': '[0001](0001-a.md)'
  };
  const read = (name: string): string => sources[name] ?? '';

  it('segue sub-índices de pasta', () => {
    expect(
      unindexedDocuments(['docs/README.md', 'docs/guia.md', 'docs/adr/README.md', 'docs/adr/0001-a.md'], read)
    ).toEqual([]);
  });

  it('acusa documento órfão', () => {
    expect(unindexedDocuments(['docs/guia.md', 'docs/orfao.md'], read)).toEqual(['docs/orfao.md']);
  });
});

describe('mapa de arquitetura gerado', () => {
  it('reescreve só a seção entre marcadores', () => {
    const source = 'antes\n<!-- generated:boundaries:start -->\nvelho\n<!-- generated:boundaries:end -->\ndepois\n';
    const synced = syncArchitectureDoc(source)!;
    expect(synced).toContain(boundariesMarkdown());
    expect(synced).not.toContain('velho');
    expect(synced.startsWith('antes\n')).toBe(true);
    expect(synced.endsWith('depois\n')).toBe(true);
    expect(syncArchitectureDoc(synced)).toBe(synced);
  });

  it('exige os marcadores', () => {
    expect(syncArchitectureDoc('sem marcadores')).toBeUndefined();
  });
});

describe('AGENTS.md de ferramenta gerada', () => {
  it('é local, curto e cita o slug', () => {
    const source = toolAgentsMarkdown('split-pdf');
    expect(source).toContain('packages/split-pdf/');
    expect(localAgentViolations(source)).toEqual([]);
  });
});
