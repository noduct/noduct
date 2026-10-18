import { describe, expect, it } from 'vitest';
import stylelint from 'stylelint';

async function lint(code: string, extension = 'css') {
  const result = await stylelint.lint({
    code,
    codeFilename: `packages/tool-template/src/components/GuardrailFixture.${extension}`
  });

  return result.results.flatMap((item) => item.warnings.map((warning) => warning.rule));
}

describe('Stylelint design token guardrails', () => {
  it.each([
    ['hex color', '.sample { color: #123456; }', 'color-no-hex'],
    ['named color', '.sample { color: red; }', 'color-named'],
    ['color function', '.sample { color: rgb(1 2 3); }', 'function-disallowed-list'],
    [
      'unknown custom property',
      '.sample { color: var(--color-does-not-exist); }',
      'csstools/value-no-unknown-custom-properties'
    ],
    [
      'literal radius',
      '.sample { border-radius: 6px; }',
      'scale-unlimited/declaration-strict-value'
    ],
    ['literal z-index', '.sample { z-index: 500; }', 'scale-unlimited/declaration-strict-value'],
    [
      'literal shadow',
      '.sample { box-shadow: 0 1px 2px var(--color-border); }',
      'scale-unlimited/declaration-strict-value'
    ]
  ])(
    'rejects %s',
    async (_, code, rule) => {
      expect(await lint(code)).toContain(rule);
    },
    30_000
  );

  it('checks CSS embedded in Astro components', async () => {
    const rules = await lint(
      '<div>Example</div><style>.sample { color: #123456; }</style>',
      'astro'
    );
    expect(rules).toContain('color-no-hex');
  }, 30_000);

  it('allows declared tokens in consumers', async () => {
    expect(
      await lint('.sample { color: var(--color-text); border-radius: var(--radius-md); }')
    ).toEqual([]);
  }, 30_000);
});
