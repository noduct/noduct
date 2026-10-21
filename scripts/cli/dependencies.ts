import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { rootDir } from '../pages-manifest.ts';

interface Lockfile {
  packages: Record<string, { version?: string; link?: boolean }>;
}

export function assertInstalledDependencies(workspace = rootDir): void {
  const expectedPath = join(workspace, 'package-lock.json');
  const installedPath = join(workspace, 'node_modules', '.package-lock.json');
  const repair = 'Dependências desatualizadas: rode npm ci.';
  if (!existsSync(installedPath)) throw new Error(repair);
  const expected = JSON.parse(readFileSync(expectedPath, 'utf8')) as Lockfile;
  const installed = JSON.parse(readFileSync(installedPath, 'utf8')) as Lockfile;
  const manifest = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
    const path = `node_modules/${name}`;
    if (
      !expected.packages[path] ||
      installed.packages[path]?.version !== expected.packages[path]?.version
    )
      throw new Error(repair);
  }
  for (const [path, entry] of Object.entries(installed.packages)) {
    if (entry.link) continue;
    if (expected.packages[path]?.version !== entry.version) throw new Error(repair);
  }
}
