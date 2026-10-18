import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guardrails } from '../guardrails.config.ts';

const emoji = /\p{RGI_Emoji}/v;
const deprecatedName = String.fromCharCode(84, 111, 108, 118, 105, 114, 97);
const productHost = ['noduct', 'github', 'io'].join('.');
const sourceFile = /^(src|packages\/[^/]+\/src|scripts|tests)\//;
const textFile = /\.(?:astro|css|html|js|json|mjs|md|ts|tsx|yml|yaml)$/;
const generatedClass = /_[a-zA-Z]+_[a-z0-9]{5}_\d+/;
const iconGlyph = /[↗✓↥⠿↑↓×]/u;

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
  const exempt = guardrails.exemptFixtures.some((prefix) => path.startsWith(prefix));
  if (exempt) return errors;
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
  if (!sourceFile.test(path) || !textFile.test(path)) return errors;
  if (emoji.test(contents)) errors.push('emoji in source');
  if (path.endsWith('.astro') && iconGlyph.test(contents.replace(/---[\s\S]*?---/g, '')))
    errors.push('text glyph used as an icon');
  if (
    !guardrails.legacyUrlFiles.some((allowed) => allowed === path) &&
    (contents.includes(productHost) || /['"]\/noduct(?:\/|['"])/.test(contents))
  )
    errors.push('hardcoded product URL');
  if (generatedClass.test(contents)) errors.push('generated CSS Module class hash');
  if (
    /^(?:packages\/[^/]+\/src\/|src\/data\/tools\.json$|src\/i18n\/catalog\/)/.test(path) &&
    contents.includes('TODO(i18n)')
  )
    errors.push('unresolved i18n placeholder');
  if (path.endsWith('.astro') && /(?:^|\/)pages\//.test(path) && !hasShell(resolve(path)))
    errors.push('page does not render AppShell');
  if (
    path.endsWith('.astro') &&
    !guardrails.inlineScriptFiles.some((allowed) => allowed === path) &&
    /<script\b[^>]*\bis:inline\b/.test(contents)
  )
    errors.push('inline script outside AppShell');
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
  return tracked.flatMap((file) => {
    const path = file.replaceAll('\\', '/');
    if (!existsSync(file)) return [];
    if (!textFile.test(path) && !path.toLowerCase().includes(deprecatedName.toLowerCase()))
      return [];
    const contents = readFileSync(file, 'utf8');
    return validateUiContent(path, contents).map((error) => `${path}: ${error}`);
  });
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/validate-ui.ts')) {
  const errors = validateUi();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('UI guardrails passed.');
}
