import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { validateUiContent } from '../../scripts/validate-ui';

describe('UI guardrails reject violating fixtures', () => {
  it('rejects product URLs, generated CSS classes, emoji, glyph icons and inline scripts', () => {
    const source =
      '<script is:inline></script><span class="' +
      ['_item', '_abcde', '_1'].join('') +
      '">' +
      String.fromCodePoint(0x2197, 0x20, 0x1f600) +
      ' https://' +
      ['noduct', 'github', 'io'].join('.') +
      '/</span>';
    const errors = validateUiContent('packages/merge-pdf/src/components/Bad.astro', source);
    expect(errors).toContain('hardcoded product URL');
    expect(errors).toContain('generated CSS Module class hash');
    expect(errors).toContain('emoji in source');
    expect(errors).toContain('text glyph used as an icon');
    expect(errors).toContain('inline script outside AppShell');
  });

  it('does not treat copyright as an emoji', () => {
    expect(
      validateUiContent('packages/merge-pdf/src/components/Legal.astro', '<p>© Noduct</p>')
    ).not.toContain('emoji in source');
  });

  it('requires an AppShell composition on a new page', () => {
    expect(validateUiContent('packages/merge-pdf/src/pages/bad.astro', '<main />')).toContain(
      'page does not render AppShell'
    );
  });

  it('ESLint rejects a raw SVG and literal UI text', async () => {
    const eslint = new ESLint();
    const [result] = await eslint.lintText('<main><svg></svg><p>Hardcoded action</p></main>', {
      filePath: 'packages/merge-pdf/src/components/Bad.astro'
    });
    const ids = result?.messages.map((message) => message.ruleId);
    expect(ids).toContain('no-restricted-syntax');
    expect(ids).toContain('noduct/no-hardcoded-text');
    const [clientResult] = await eslint.lintText(
      "<main><script>document.body.textContent = 'Hardcoded action'; document.body.setAttribute('aria-label', 'Remove');</script></main>",
      { filePath: 'packages/merge-pdf/src/components/ClientText.astro' }
    );
    expect(
      clientResult?.messages.filter((message) => message.ruleId === 'noduct/no-hardcoded-text')
    ).toHaveLength(2);
  }, 30_000);
});
