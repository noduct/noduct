import { describe, expect, it } from 'vitest';
import {
  evaluateRatchet,
  ratchetCounts,
  type RatchetSnapshot
} from '../../scripts/check-guardrail-ratchet';

function snapshot(files: Record<string, string>): RatchetSnapshot {
  return { files: new Map(Object.entries(files)) };
}

describe('guardrail ratchet', () => {
  it('counts suppressions and focused or skipped tests, ignoring string literals', () => {
    const counts = ratchetCounts(
      snapshot({
        'tests/unit/example.test.ts': `const text = 'test.skip @ts-ignore';\nconst example = '// eslint-disable-next-line x';\n// @ts-expect-error\ntest.skip(true);\ntest.fixme(true);\ntest.only('focus', () => {});`
      })
    );
    expect(counts.get('@ts-ignore')).toBe(0);
    expect(counts.get('eslint-disable')).toBe(0);
    expect(counts.get('@ts-expect-error')).toBe(1);
    expect(counts.get('test.skip')).toBe(1);
    expect(counts.get('test.fixme')).toBe(1);
    expect(counts.get('.only')).toBe(1);
  });

  it('blocks increased suppressions and allowlists without the PR label', () => {
    const base = snapshot({
      'guardrails.config.ts': `export const guardrails = { rawSvgFiles: ['a'], brandTexts: ['Noduct'] } as const;`,
      'packages/design-system/src/icons/registry.ts': `export const iconRegistry = { one: 1 } as const;`,
      'src/a.ts': `// eslint-disable-next-line x`
    });
    const current = snapshot({
      'guardrails.config.ts': `export const guardrails = { rawSvgFiles: ['a', 'b'], brandTexts: ['Noduct'] } as const;`,
      'packages/design-system/src/icons/registry.ts': `export const iconRegistry = { one: 1, two: 2 } as const;`,
      'src/a.ts': `// eslint-disable-next-line x\n// stylelint-disable x`
    });
    const result = evaluateRatchet(base, current, false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('allowlist:rawSvgFiles increased'),
        expect.stringContaining('allowlist:icons increased'),
        expect.stringContaining('stylelint-disable increased')
      ])
    );
    expect(evaluateRatchet(base, current, true).violations).toEqual([]);
  });

  it('requires the label to change guardrail configuration even with no counter growth', () => {
    const base = snapshot({ 'eslint.config.js': 'export default [];' });
    const current = snapshot({ 'eslint.config.js': 'export default [rule];' });
    expect(evaluateRatchet(base, current, false).violations).toContain(
      'eslint.config.js changed; PR needs guardrail-change label'
    );
    expect(evaluateRatchet(base, current, true).violations).toEqual([]);
  });

  it('allows reductions and fails closed on a new allowlist member', () => {
    const base = snapshot({
      'guardrails.config.ts': `export const guardrails = { exemptFixtures: ['a', 'b'] } as const;`
    });
    const lower = snapshot({
      'guardrails.config.ts': `export const guardrails = { exemptFixtures: ['a'] } as const;`
    });
    const higher = snapshot({
      'guardrails.config.ts': `export const guardrails = { exemptFixtures: ['a', 'b', 'c'] } as const;`
    });
    expect(evaluateRatchet(base, lower, false).violations).toEqual([]);
    expect(evaluateRatchet(base, higher, false).violations).toHaveLength(1);
  });
});
