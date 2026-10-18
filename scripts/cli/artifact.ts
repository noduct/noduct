import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pagesDir, rootDir } from '../pages-manifest.ts';

const roots = ['src', 'packages', 'scripts', 'tests/fixtures'];
const files = [
  'package.json',
  'package-lock.json',
  'astro.config.mjs',
  'tsconfig.json',
  'guardrails.config.ts'
];
const ignored = new Set(['node_modules', 'dist', 'dist-pages', '.astro', '.git']);

export function sourceHash(): string {
  const paths = [...files.map((name) => join(rootDir, name))];
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) paths.push(path);
    }
  };
  for (const root of roots) walk(join(rootDir, root));
  const hash = createHash('sha256');
  for (const path of paths.sort()) {
    if (!existsSync(path)) continue;
    hash.update(relative(rootDir, path).replaceAll('\\', '/'));
    hash.update(readFileSync(path));
  }
  return hash.digest('hex');
}

export function stampArtifact(): void {
  writeFileSync(
    join(pagesDir, '.build-info.json'),
    JSON.stringify({ sourceHash: sourceHash() }, null, 2) + '\n'
  );
}

export function assertFreshArtifact(artifactDir = pagesDir, expectedHash = sourceHash()): void {
  const path = join(artifactDir, '.build-info.json');
  if (!existsSync(join(artifactDir, 'index.html')) || !existsSync(path)) {
    throw new Error('Pages artifact missing. Run npm run build.');
  }
  let saved: { sourceHash?: string };
  try {
    saved = JSON.parse(readFileSync(path, 'utf8')) as { sourceHash?: string };
  } catch {
    throw new Error('Pages artifact metadata is invalid. Run npm run build.');
  }
  if (saved.sourceHash !== expectedHash)
    throw new Error('Pages artifact is stale. Run npm run build.');
}

export function assertE2eFixture(): void {
  if (!existsSync(join(rootDir, '.sponsorship-fixture', 'active', 'index.html')))
    throw new Error('E2E fixture is missing. Run npm run build.');
}
