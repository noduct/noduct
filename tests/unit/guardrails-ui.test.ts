import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { readFileSync } from 'node:fs';
import { validateUiContent } from '../../scripts/validate-ui';

describe('UI guardrails reject violating fixtures', () => {
  const bypasses = JSON.parse(readFileSync(new URL('../fixtures/guardrails/ui-bypasses.case', import.meta.url), 'utf8')) as Array<{ id: string; path: string; content: string; expected: string }>;
  it.each(bypasses)('rejects physical fixture $id', ({ path, content, expected }) => {
    expect(validateUiContent(path, content)).toContain(expected);
  });
  it('rejects the deprecated-name fixture', () => {
    const contents = readFileSync(new URL('../fixtures/guardrails/deprecated-name.case', import.meta.url), 'utf8');
    expect(validateUiContent('src/components/Deprecated.astro', contents)).toContain('deprecated product name');
  });
  it('rejects product URLs, generated CSS classes, emoji, glyph icons and inline scripts', () => {
    const source =
      '<script is:inline></script><span class="' +
      ['_item', '_abcde', '_1'].join('') +
      '">' +
      String.fromCodePoint(0x2197, 0x20, 0x1f600) +
      ' https://' +
      ['nod' + 'uct', 'github', 'io'].join('.') +
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

  it.each([
    '<!-- <AppShell /> --><main />',
    '<main><AppShell /></main>',
    '<AppShell><header /></AppShell>',
    '<AppShell><footer /></AppShell>',
    '<AppShell><nav aria-label="Breadcrumb" /></AppShell>'
  ])('requires a root shell and rejects private shell structure', async (template) => {
    const eslint = new ESLint();
    const source = `---\nimport AppShell from '@noduct/design-system/shell/AppShell.astro';\n---\n${template}`;
    const [result] = await eslint.lintText(source, { filePath: 'packages/merge-pdf/src/pages/guardrail.astro' });
    expect(result?.messages.map((message) => message.ruleId)).toContain('noduct/require-app-shell');
  }, 30_000);

  it('rejects expression and client text literals', async () => {
    const eslint = new ESLint();
    const [astro] = await eslint.lintText(
      '<button aria-label={"Remove file"} aria-description="Dangerous action" value="Delete file">{"Hello world"}</button>',
      { filePath: 'packages/merge-pdf/src/components/Guardrail.astro' }
    );
    expect(astro?.messages.filter((message) => message.ruleId === 'noduct/no-hardcoded-text').length).toBeGreaterThanOrEqual(4);
    const [client] = await eslint.lintText(
      "element.innerHTML = 'Hello world'; element.setAttribute('aria-label', `Remove file`);",
      { filePath: 'packages/design-system/src/guardrail-runtime.ts' }
    );
    expect(client?.messages.filter((message) => message.ruleId === 'noduct/no-hardcoded-text')).toHaveLength(2);
  }, 30_000);

  it.each([
    ['.stylelintrc.json', '{}'],
    ['.stylelintrc', '{}'],
    ['.eslintrc.yaml', 'rules: {}'],
    ['packages/merge-pdf/eslint.config.js', 'export default []'],
    ['package.json', JSON.stringify({ stylelint: {} })],
    ['package.json', JSON.stringify({ eslintConfig: {} })]
  ])('rejects alternative lint config at %s', (path, content) => {
    expect(validateUiContent(path, content)).toContain('alternative lint configuration');
  });

  it('rejects hidden inline scripts and SVG markup', () => {
    expect(validateUiContent('src/components/Bad.astro', '<script define:vars={{ x: 1 }} />')).toContain('inline script outside AppShell');
    expect(validateUiContent('src/components/Bad.astro', '<Fragment set:html={"<script>alert(1)</script>"} />')).toContain('inline script outside AppShell');
    expect(validateUiContent('src/components/Bad.astro', '<Fragment set:html={"<svg></svg>"} />')).toContain('raw SVG through set:html');
    expect(validateUiContent('src/components/Bad.astro', '<Fragment set:html={`<svg></svg>`} />')).toContain('raw SVG through set:html');
  });

  it.each(['✔', '✕', '→', '★', '☰', '⋮', '&times;', '&#x2713;'])('rejects icon glyph %s', (glyph) => {
    expect(validateUiContent('packages/merge-pdf/src/components/IconFixture.astro', `<button>${glyph}</button>`)).toContain('text glyph used as an icon');
  });

  it('rejects glyphs in client TypeScript and CSS content', () => {
    expect(validateUiContent('packages/design-system/src/icons/bad-runtime.ts', "button.textContent = '✔';")).toContain('text glyph used as an icon');
    expect(validateUiContent('packages/design-system/src/components/Bad.module.css', ".button::before { content: '→'; }")).toContain('text glyph used as an icon');
  });

  it('rejects assembled product hosts and backtick paths', () => {
    const assembled = "const host = ['noduct'," + "'github','io'].join('.');";
    expect(validateUiContent('packages/merge-pdf/astro.config.mjs', assembled)).toContain('hardcoded product URL');
    expect(validateUiContent('public/fixture.js', '`/nod' + 'uct/old`')).toContain('hardcoded product URL');
    expect(validateUiContent('public/fixture.svg', 'href="/nod' + 'uct/old"')).toContain('hardcoded product URL');
    expect(validateUiContent('.github/CODEOWNERS', 'https://' + ['nod' + 'uct', 'github', 'io'].join('.'))).toContain('hardcoded product URL');
  });

  it('limits the workspace parity marker to the drawer component', () => {
    expect(validateUiContent('packages/merge-pdf/src/components/Other.astro', '<div data-workspace-root />')).toContain('workspace root outside WorkspaceDrawer');
  });

  it('rejects the domain-browser fixture through ESLint', async () => {
    const code = readFileSync(new URL('../fixtures/guardrails/domain-browser.case', import.meta.url), 'utf8');
    const [result] = await new ESLint().lintText(code, { filePath: 'packages/pdf-core/src/guardrail-fixture.ts' });
    const ids = result?.messages.map((message) => message.ruleId) ?? [];
    expect(ids).toContain('no-restricted-imports');
    expect(ids).toContain('no-restricted-properties');
    expect(ids).toContain('no-restricted-globals');
  }, 30_000);

  it('rejects the shell-comment fixture through ESLint', async () => {
    const code = readFileSync(new URL('../fixtures/guardrails/page-no-shell.case', import.meta.url), 'utf8');
    const [result] = await new ESLint().lintText(code, { filePath: 'packages/merge-pdf/src/pages/guardrail-fixture.astro' });
    expect(result?.messages.map((message) => message.ruleId)).toContain('noduct/require-app-shell');
  }, 30_000);
});
