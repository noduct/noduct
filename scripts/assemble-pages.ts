import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { topology } from '@noduct/tool-runtime';
import { deployedTools, hubDistDir, pagesDir } from './pages-manifest';

/*
 * Monta o artefato do GitHub Pages na topologia final (ADR 0005):
 *   dist-pages/            hub (raiz da origem)
 *   dist-pages/<slug>/     cada ferramenta declarada em pages-manifest
 *   dist-pages/noduct/...  stubs de redirecionamento do base antigo do hub (transição, ≥ 12 meses)
 */
const LEGACY_BASE = 'noduct';

function fail(message: string): never {
  console.error(`assemble-pages: ${message}`);
  process.exit(1);
}

function htmlPages(dir: string, base = dir): string[] {
  const pages: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) pages.push(...htmlPages(path, base));
    else if (entry.name === 'index.html') pages.push(relative(base, dirname(path)).split(sep).join('/'));
  }
  return pages;
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function legacyStub(target: string): string {
  const href = escapeHtml(target);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Noduct</title>
    <link rel="canonical" href="${href}" />
    <meta http-equiv="refresh" content="0; url=${href}" />
  </head>
  <body>
    <p><a href="${href}">${href}</a></p>
  </body>
</html>
`;
}

if (!existsSync(join(hubDistDir, 'index.html'))) fail('hub build not found in dist/. Run "npm run build" first.');

rmSync(pagesDir, { recursive: true, force: true });
cpSync(hubDistDir, pagesDir, { recursive: true });

const hubRoutes = htmlPages(hubDistDir).filter((route) => !/(^|\/)404$/.test(route));

for (const tool of deployedTools()) {
  if (!existsSync(join(tool.distDir, 'index.html'))) {
    fail(`build of "${tool.slug}" not found in ${relative(process.cwd(), tool.distDir)}.`);
  }
  const target = join(pagesDir, tool.slug);
  if (existsSync(target)) fail(`"${tool.slug}" collides with a hub path in the artifact.`);
  cpSync(tool.distDir, target, { recursive: true });
  console.log(`assemble-pages: ${tool.slug} → ${topology.toolPath(tool.slug)}`);
}

// Stubs do base antigo: /noduct/<rota>/ → nova URL do hub. O GitHub não redireciona Pages de
// project site após o rename do repositório, então os stubs preservam links já compartilhados.
const legacyDir = join(pagesDir, LEGACY_BASE);
if (existsSync(legacyDir)) fail(`"${LEGACY_BASE}" collides with an existing path in the artifact.`);
for (const route of hubRoutes) {
  const dir = join(legacyDir, ...route.split('/').filter(Boolean));
  mkdirSync(dir, { recursive: true });
  const url = new URL(route === '' ? '' : `${route}/`, topology.hubUrl()).toString();
  writeFileSync(join(dir, 'index.html'), legacyStub(url));
}
const registry = join(hubDistDir, 'data', 'sponsorships.json');
if (existsSync(registry) && statSync(registry).isFile()) {
  mkdirSync(join(legacyDir, 'data'), { recursive: true });
  cpSync(registry, join(legacyDir, 'data', 'sponsorships.json'));
}

console.log(`assemble-pages: ${hubRoutes.length} legacy stubs under /${LEGACY_BASE}/; artifact ready in dist-pages/.`);
