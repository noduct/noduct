import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guardrails } from '../guardrails.config.ts';
import { checkAgents } from './check-agents.ts';

const emoji = /\p{RGI_Emoji}/v;
const deprecatedName = String.fromCharCode(84, 111, 108, 118, 105, 114, 97);
const productHost = ['noduct', 'github', 'io'].join('.');
const generatedClass = /_[a-zA-Z]+_[a-z0-9]{5}_\d+/;
const iconGlyph = /[\u2190-\u21ff\u22ee\u2300-\u23ff\u2500-\u257f\u25a0-\u25ff\u2600-\u26ff\u2700-\u27bf]/u;
function containsIconGlyph(source: string): boolean {
  if (iconGlyph.test(source) || /&(?:times|check|cross|rarr|larr|star);/i.test(source)) return true;
  return [...source.matchAll(/&#(x[0-9a-f]+|\d+);/gi)].some((match) => {
    const encoded = match[1];
    if (!encoded) return false;
    const value = encoded.startsWith('x') ? parseInt(encoded.slice(1), 16) : parseInt(encoded, 10);
    return Number.isFinite(value) && value <= 0x10ffff && iconGlyph.test(String.fromCodePoint(value));
  });
}

function hasShell(file: string, seen = new Set<string>()): boolean {
  if (seen.has(file)) return false;
  seen.add(file);
  let contents: string;
  try {
    contents = readFileSync(file, 'utf8');
  } catch {
    return false;
  }
  if (
    /import\s+AppShell\s+from\s+['"]@noduct\/design-system\/shell\/AppShell\.astro['"]/.test(
      contents
    ) &&
    /<AppShell\b/.test(contents)
  )
    return true;
  for (const match of contents.matchAll(/import\s+\w+\s+from\s+['"]([^'"]+\.astro)['"]/g)) {
    const specifier = match[1];
    if (!specifier) continue;
    let next: string | undefined;
    if (specifier.startsWith('@/')) next = resolve('src', specifier.slice(2));
    else if (specifier.startsWith('.')) next = resolve(file, '..', specifier);
    else if (specifier.startsWith('@noduct/design-system/'))
      next = resolve('packages/design-system', specifier.slice('@noduct/design-system/'.length));
    if (next && hasShell(next, seen)) return true;
  }
  return false;
}

export function validateUiContent(path: string, contents: string): string[] {
  const errors: string[] = [];
  let packageLintConfig = false;
  if (path.endsWith('/package.json') || path === 'package.json') {
    try {
      const manifest = JSON.parse(contents) as Record<string, unknown>;
      packageLintConfig = Object.hasOwn(manifest, 'stylelint') || Object.hasOwn(manifest, 'eslintConfig');
    } catch {
      // JSON validity is checked by the package tooling.
    }
  }
  if (
    /(?:^|\/)\.(?:stylelintrc|eslintrc)(?:\.[^/]+)?$/.test(path) ||
    (/(?:^|\/)(?:eslint|stylelint)\.config\.[^/]+$/.test(path) &&
      path !== 'eslint.config.js' && path !== 'stylelint.config.mjs') ||
    packageLintConfig
  ) errors.push('alternative lint configuration');
  if (
    path.toLowerCase().includes(deprecatedName.toLowerCase()) ||
    contents.toLowerCase().includes(deprecatedName.toLowerCase())
  )
    errors.push('deprecated product name');
  if (
    path.endsWith('.md') &&
    /npm run (?:dev:|build:|lint:styles|lint\b|typecheck\b|validate:|check:sponsors|test:lighthouse)/.test(
      contents
    )
  )
    errors.push('removed root script in documentation');
  if (emoji.test(contents)) errors.push('emoji in source');
  if (/(?:\.astro|\.ts|\.tsx|\.css)$/.test(path) &&
      /^(?:src|packages\/[^/]+\/src)\//.test(path) &&
      containsIconGlyph(path.endsWith('.astro') ? contents.replace(/---[\s\S]*?---/g, '') : contents))
    errors.push('text glyph used as an icon');
  if (
    !path.endsWith('.md') &&
    !guardrails.legacyUrlFiles.some((allowed) => allowed === path) &&
    (contents.includes(productHost) ||
      /['"`]\/noduct(?:\/|['"`])/.test(contents) ||
      /\[\s*['"]noduct['"]\s*,\s*['"]github['"]\s*,\s*['"]io['"]\s*\]\s*\.join\s*\(/.test(contents))
  )
    errors.push('hardcoded product URL');
  if (generatedClass.test(contents)) errors.push('generated CSS Module class hash');
  if (path.endsWith('.astro') && path !== 'packages/design-system/src/components/WorkspaceDrawer.astro' &&
      /<[A-Za-z][^>]*\bdata-workspace-root\b/.test(contents))
    errors.push('workspace root outside WorkspaceDrawer');
  if (
    /^(?:packages\/[^/]+\/src\/|src\/data\/tools\.json$|src\/i18n\/catalog\/)/.test(path) &&
    contents.includes('TODO(i18n)')
  )
    errors.push('unresolved i18n placeholder');
  if (path.endsWith('.astro') && /(?:^|\/)pages\//.test(path) &&
      !guardrails.shelllessFixturePages.some((allowed) => allowed === path) &&
      !hasShell(resolve(path)))
    errors.push('page does not render AppShell');
  if (
    path.endsWith('.astro') &&
    !guardrails.inlineScriptFiles.some((allowed) => allowed === path) &&
    (/<script\b[^>]*\b(?:is:inline|define:vars)\b/.test(contents) ||
      /set:html\s*=\s*\{?\s*['"`][\s\S]*?<script\b/i.test(contents))
  )
    errors.push('inline script outside AppShell');
  if (path.endsWith('.astro') && /set:html\s*=\s*\{?\s*['"`][\s\S]*?<svg\b/i.test(contents))
    errors.push('raw SVG through set:html');
  return errors;
}

export function validateUi(): string[] {
  const tracked = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean);
  const allowlistChecks: ReadonlyArray<[string, readonly string[], RegExp]> = [
    ['rawSvgFiles', guardrails.rawSvgFiles, /<svg\b/],
    ['legacyUrlFiles', guardrails.legacyUrlFiles, /noduct\.github\.io|\/noduct|productHost|legacy/],
    ['inlineScriptFiles', guardrails.inlineScriptFiles, /is:inline|define:vars/],
    ['shelllessFixturePages', guardrails.shelllessFixturePages, /<[^>]+>/],
    ['violationFixtureFiles', guardrails.violationFixtureFiles, /[\s\S]/]
  ];
  const staleEntries = allowlistChecks.flatMap(([name, paths, pattern]) =>
    paths.filter((path) => !existsSync(path) || !pattern.test(readFileSync(path, 'utf8')))
      .map((path) => `[ui-contract] guardrails.config.ts:1 — ${name} contains stale entry ${path}. Remove the exception or restore its specific fixture. Ver docs/guardrails.md#ui-contract`)
  );
  for (const path of guardrails.controlFiles) {
    if (!existsSync(path))
      staleEntries.push(`[ui-contract] guardrails.config.ts:1 — controlFiles contains stale entry ${path}. Restore the control file or remove the entry with guardrail-change review. Ver docs/guardrails.md#ui-contract`);
  }
  return [
    ...staleEntries,
    ...tracked.flatMap((file) => {
      const path = file.replaceAll('\\', '/');
      if (!existsSync(file)) return [];
      if (guardrails.violationFixtureFiles.some((allowed) => allowed === path)) return [];
      const bytes = readFileSync(file);
      if (bytes.includes(0)) return [];
      const contents = bytes.toString('utf8');
      const fixes: Record<string, [string, string, string]> = {
        'deprecated product name': [
          'Noduct é a identidade única.',
          'Substitua o nome antigo por Noduct.',
          'ui-contract'
        ],
        'removed root script in documentation': [
          'Comandos obsoletos induzem falhas.',
          'Use um script de package.json.',
          'script-contract'
        ],
        'emoji in source': [
          'Emoji diverge do sistema de ícones.',
          'Use Icon e icons/registry.ts.',
          'ui-contract'
        ],
        'text glyph used as an icon': [
          'Glifos não seguem o sistema de ícones.',
          'Use Icon e icons/registry.ts.',
          'ui-contract'
        ],
        'hardcoded product URL': [
          'A topologia precisa ter fonte única.',
          'Use @noduct/tool-runtime/topology.',
          'ui-contract'
        ],
        'generated CSS Module class hash': [
          'Hashes mudam entre builds.',
          'Importe classes do CSS Module ou use data-*.',
          'ui-contract'
        ],
        'workspace root outside WorkspaceDrawer': [
          'A marca do drawer não pode excluir conteúdo da paridade.',
          'Use o componente WorkspaceDrawer.',
          'shell-parity'
        ],
        'unresolved i18n placeholder': [
          'Traduções incompletas chegam ao usuário.',
          'Complete en, pt-BR e es.',
          'ui-contract'
        ],
        'page does not render AppShell': [
          'O shell mantém navegação e SEO consistentes.',
          'Componha AppShell e ToolPage; veja packages/tool-template/src/pages/index.astro.',
          'require-app-shell'
        ],
        'inline script outside AppShell': [
          'Scripts inline dispersos dificultam CSP e preferências.',
          'Mova para o shell ou um módulo cliente.',
          'ui-contract'
        ],
        'alternative lint configuration': [
          'Configuração alternativa pode substituir o lint oficial.',
          'Use apenas eslint.config.js e stylelint.config.mjs da raiz.',
          'ui-contract'
        ],
        'raw SVG through set:html': [
          'SVG injetado contorna o registro de ícones.',
          'Use Icon e icons/registry.ts.',
          'no-raw-svg'
        ]
      };
      return validateUiContent(path, contents).map((error) => {
        const [why, fix, id] = fixes[error] ?? [
          'Violação de UI.',
          'Consulte a regra.',
          'ui-contract'
        ];
        const fragment: Record<string, RegExp> = {
          'emoji in source': /\p{RGI_Emoji}/v,
          'hardcoded product URL': new RegExp(productHost.replaceAll('.', '\\.') + '|/noduct', 'u'),
          'generated CSS Module class hash': /_[a-zA-Z]+_[a-z0-9]{5}_\d+/u,
          'unresolved i18n placeholder': /TODO\(i18n\)/u,
          'inline script outside AppShell': /is:inline/u
        };
        const match = fragment[error]?.exec(contents);
        const line = match ? contents.slice(0, match.index).split('\n').length : 1;
        return `[${id}] ${path}:${line} — ${error}. ${why} ${fix} Ver docs/guardrails.md#${id}`;
      });
    }),
    ...checkAgents()
  ];
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validate-ui.ts')) {
  const errors = validateUi();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('UI guardrails passed.');
}
