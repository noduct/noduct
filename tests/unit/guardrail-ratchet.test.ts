import { describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import {
  evaluateRatchet,
  prHasLabel,
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

  it('ignores checkout line endings while preserving control file changes', () => {
    const base = snapshot({ 'eslint.config.js': 'export default [\n  rule\n];\n' });
    const windowsCheckout = snapshot({
      'eslint.config.js': 'export default [\r\n  rule\r\n];\r\n'
    });
    expect(evaluateRatchet(base, windowsCheckout, false).violations).toEqual([]);
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
    expect(evaluateRatchet(base, lower, false).violations).toContain(
      'guardrails.config.ts changed; PR needs guardrail-change label'
    );
    expect(evaluateRatchet(base, higher, false).violations).toContain(
      'guardrails.config.ts changed; PR needs guardrail-change label'
    );
  });

  it.each(readFileSync(new URL('../fixtures/guardrails/ratchet-control-paths.case', import.meta.url), 'utf8').trim().split(/\r?\n/))('protects control file %s', (path) => {
    const base = snapshot({ [path]: 'before' });
    const current = snapshot({ [path]: 'after' });
    expect(evaluateRatchet(base, current, false).violations).toContain(
      `${path} changed; PR needs guardrail-change label`
    );
  });

  it('rejects one-for-one suppression and allowlist substitutions', () => {
    const base = snapshot({
      'src/one.ts': '// eslint-disable-next-line no-unused-vars',
      'guardrails.config.ts': "export const guardrails = { exemptFixtures: ['tests/fixtures/guardrails/'] } as const;"
    });
    const current = snapshot({
      'src/one.ts': '// eslint-disable-next-line no-console',
      'guardrails.config.ts': "export const guardrails = { exemptFixtures: ['packages/'] } as const;"
    });
    const violations = evaluateRatchet(base, current, false).violations;
    expect(violations).toContain('src/one.ts added a suppression; PR needs guardrail-change label');
    expect(violations).toContain('guardrails.config.ts changed; PR needs guardrail-change label');
  });

  it.each([
    '// @ts-nocheck', 'test.describe.skip("group", () => {})',
    'test.describe.fixme("group", () => {})', 'xit("case", () => {})',
    'xdescribe("group", () => {})', 'test.skip(true, "reason")',
    'test.skipIf(true)("case", () => {})', 'testInfo.skip()',
    'test.fail("case", () => {})'
  ])('detects added suppression form %s', (content) => {
    const violations = evaluateRatchet(snapshot({}), snapshot({ 'tests/unit/new.test.ts': content }), false).violations;
    expect(violations.length).toBeGreaterThan(0);
  });

  it.each(['cjs', 'mts', 'cts', 'jsx'])('scans .%s source files', (extension) => {
    const counts = ratchetCounts(snapshot({ [`tests/new.${extension}`]: '// @ts-nocheck' }));
    expect(counts.get('@ts-nocheck')).toBe(1);
  });

  it('reads a real pull request event fixture', async () => {
    const event = fileURLToPath(new URL('../fixtures/guardrails/pr-labeled.case', import.meta.url));
    expect(await prHasLabel(event, '', '')).toBe(true);
  });

  it('reads current PR labels instead of trusting a stale event snapshot', async () => {
    const event = fileURLToPath(new URL('../fixtures/guardrails/pr-labeled.case', import.meta.url));
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => [] }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      expect(await prHasLabel(event, 'noduct/noduct', 'test-token')).toBe(false);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.github.com/repos/noduct/noduct/issues/39/labels',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('documents every pre-existing skipped test with a reason', () => {
    const baseline = JSON.parse(readFileSync(new URL('../../scripts/guardrail-skip-baseline.json', import.meta.url), 'utf8')) as Array<{ path: string; marker: string; count: number; reason: string }>;
    expect(baseline).toHaveLength(2);
    for (const entry of baseline) {
      const source = readFileSync(fileURLToPath(new URL(`../../${entry.path}`, import.meta.url)), 'utf8');
      expect(source.split(entry.marker).length - 1, entry.path).toBe(entry.count);
      expect(entry.reason.length).toBeGreaterThan(20);
    }
  });
});
