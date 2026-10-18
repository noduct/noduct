import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { deployedTools, rootDir } from './pages-manifest.ts';

const publicScripts: Record<string, string> = {
  dev: 'tsx scripts/noduct.ts dev',
  build: 'tsx scripts/noduct.ts build',
  preview: 'tsx scripts/noduct.ts preview',
  check: 'tsx scripts/noduct.ts check',
  test: 'vitest run',
  'test:watch': 'vitest',
  'test:e2e': 'tsx scripts/noduct.ts e2e',
  verify: 'tsx scripts/noduct.ts verify',
  'new:tool': 'tsx scripts/noduct.ts new-tool',
  format: 'prettier --write .',
  github: 'node scripts/github/manage.mjs'
};
export function rootScriptViolations(scripts: Record<string, string>): string[] {
  const failures: string[] = [];
  for (const key of Object.keys(scripts))
    if (!(key in publicScripts)) failures.push(`Unexpected root script: ${key}`);
  for (const [key, value] of Object.entries(publicScripts))
    if (scripts[key] !== value) failures.push(`${key}: expected ${value}`);
  return failures;
}
const read = (path: string): string => readFileSync(join(rootDir, path), 'utf8');
const root = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
const errors: string[] = [];
const keys = Object.keys(root.scripts ?? {});
errors.push(...rootScriptViolations(root.scripts ?? {}));

const tools = deployedTools();
const slugs = new Set<string>();
const versionedSlugs = new Set<string>();
for (const tool of tools) {
  if (slugs.has(tool.slug)) errors.push(`Duplicate tool slug: ${tool.slug}`);
  slugs.add(tool.slug);
  const manifestPath = relative(rootDir, join(tool.packageDir, 'package.json')).replaceAll(
    '\\',
    '/'
  );
  if (
    execFileSync('git', ['ls-files', '--', manifestPath], { cwd: rootDir, encoding: 'utf8' }).trim()
  )
    versionedSlugs.add(tool.slug);
  const manifest = JSON.parse(readFileSync(join(tool.packageDir, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const scripts = Object.keys(manifest.scripts ?? {});
  for (const required of ['dev', 'build', 'check', 'test'])
    if (!scripts.includes(required)) errors.push(`${tool.slug}: missing ${required} script`);
  for (const script of scripts)
    if (!['dev', 'build', 'check', 'test'].includes(script))
      errors.push(`${tool.slug}: unexpected ${script} script`);
  const config = readFileSync(join(tool.packageDir, 'src/config.ts'), 'utf8');
  if (!config.includes(`slug: '${tool.slug}'`))
    errors.push(`${tool.slug}: src/config.ts slug mismatch`);
}

for (const entry of readdirSync(join(rootDir, 'packages'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(rootDir, 'packages', entry.name, 'package.json');
  if (!existsSync(path)) continue;
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    noduct?: { slug?: string };
    scripts?: Record<string, string>;
  };
  if (manifest.noduct?.slug) continue;
  const expected =
    entry.name === 'tool-template' ? ['dev', 'build', 'check', 'test'] : ['check', 'test'];
  for (const key of expected)
    if (!manifest.scripts?.[key]) errors.push(`${entry.name}: missing ${key} script`);
  if (entry.name === 'tool-template')
    for (const key of Object.keys(manifest.scripts ?? {}))
      if (!expected.includes(key)) errors.push(`${entry.name}: unexpected ${key} script`);
}

const prohibited = /(?:dev|build):[a-z0-9-]+|build:pages|validate:[a-z0-9-]+/;
const hardcodedToolPort =
  /(?:--port\s+|localhost:|127\.0\.0\.1:)(?:43(?:3[1-9]|[4-9]\d)|4[4-9]\d{2}|[5-9]\d{3}|[1-6]\d{4})\b/;
for (const file of [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-pages.yml',
  'lighthouserc.cjs',
  'playwright.config.ts'
]) {
  if (prohibited.test(read(file))) errors.push(`${file}: obsolete script reference`);
  if (hardcodedToolPort.test(read(file))) errors.push(`${file}: hardcoded tool development port`);
  for (const slug of versionedSlugs)
    if (read(file).includes(slug)) errors.push(`${file}: hardcoded tool slug ${slug}`);
}
const walk = (directory: string): string[] =>
  readdirSync(join(rootDir, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(path) : [path];
  });
for (const file of walk('scripts').filter((path) => /\.(?:ts|mjs|js)$/.test(path))) {
  if (file === 'scripts/check-scripts.ts') continue;
  if (file !== 'scripts/cli/dev.ts' && hardcodedToolPort.test(read(file)))
    errors.push(`${file}: hardcoded tool development port`);
  for (const slug of versionedSlugs)
    if (read(file).includes(slug)) errors.push(`${file}: hardcoded tool slug ${slug}`);
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/check-scripts.ts')) {
  if (errors.length) {
    for (const error of errors) {
      const path = /^([^:]+\.(?:yml|ts|js|mjs)):/.exec(error)?.[1] ?? 'package.json';
      console.error(
        `[script-contract] ${path}:1 — ${error}. Scripts e slugs fixos quebram a descoberta automática. Use apenas os subcomandos de scripts/noduct.ts e os manifests de pacote. Ver docs/guardrails.md#script-contract`
      );
    }
    process.exitCode = 1;
  } else
    console.log(
      `Script contract passed: ${keys.length} public scripts, ${tools.length} deployed tool(s).`
    );
}
