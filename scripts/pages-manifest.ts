import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertToolSlug } from '@noduct/tool-runtime';

/*
 * Ferramentas publicadas no artefato do GitHub Pages. Uma ferramenta entra declarando
 * `"noduct": { "slug": "<slug>" }` no próprio package.json; o slug precisa ser o mesmo do
 * `defineTool()` em src/config.ts (verificado em tests/unit/pages-manifest.test.ts).
 */
export interface DeployedTool {
  readonly slug: string;
  readonly packageDir: string;
  readonly distDir: string;
}

export const rootDir = new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1');
export const hubDistDir = join(rootDir, 'dist');
export const pagesDir = join(rootDir, 'dist-pages');

export function deployedTools(): DeployedTool[] {
  const packagesDir = join(rootDir, 'packages');
  const tools: DeployedTool[] = [];
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(packagesDir, entry.name, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { noduct?: { slug?: unknown } };
    const slug = manifest.noduct?.slug;
    if (typeof slug !== 'string') continue;
    assertToolSlug(slug);
    const packageDir = join(packagesDir, entry.name);
    tools.push({ slug, packageDir, distDir: join(packageDir, 'dist') });
  }
  return tools.sort((a, b) => a.slug.localeCompare(b.slug));
}
