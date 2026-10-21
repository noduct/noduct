import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { RESERVED_HUB_SEGMENTS, topology } from '@noduct/tool-runtime';
import { deployedTools, pagesDir as defaultPagesDir } from './pages-manifest';

const root = resolve(process.argv[2] ?? defaultPagesDir);
const errors: string[] = [];
const deployedSlugs = new Set(deployedTools().map((tool) => tool.slug));
const allowedTopLevel = new Set([...RESERVED_HUB_SEGMENTS, ...deployedSlugs, 'noduct']);

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function artifactPath(pathname: string): string {
  const decoded = decodeURIComponent(pathname);
  const relativePath = decoded.replace(/^\/+/, '');
  if (relativePath === '404/' || relativePath === '404') return join(root, '404.html');
  const candidate = join(root, ...relativePath.split('/').filter(Boolean));
  if (extname(candidate)) return candidate;
  return join(candidate, 'index.html');
}

function relativeName(file: string): string {
  return relative(root, file).split(sep).join('/');
}

function pagePath(file: string): string {
  const name = relativeName(file);
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return `/${name.slice(0, -'index.html'.length)}`;
  return `/${name}`;
}

function localPath(value: string): string | undefined {
  try {
    const url = new URL(value, topology.origin);
    return url.origin === topology.origin ? url.pathname : undefined;
  } catch {
    return undefined;
  }
}

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`validate-pages: artifact directory not found: ${root}`);
  process.exit(1);
}

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && !allowedTopLevel.has(entry.name)) {
    errors.push(`${entry.name}/: unknown top-level segment`);
  }
}

const files = filesUnder(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const name = relativeName(file);
  const html = readFileSync(file, 'utf8');
  const isStub = name.startsWith('noduct/');
  const is404 = /(^|\/)404(?:\/index)?\.html$/.test(name);

  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const value = match[1] ?? '';
    if (!value.startsWith('/') && !value.startsWith(topology.origin)) continue;
    const pathname = localPath(value);
    if (pathname && !existsSync(artifactPath(pathname))) {
      errors.push(`${name}: missing target ${pathname}`);
    }
  }

  if (!isStub && !is404) {
    const canonical =
      html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1] ??
      html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i)?.[1];
    const expected = `${topology.origin}${pagePath(file)}`;
    if (canonical !== expected)
      errors.push(`${name}: canonical ${canonical ?? '(missing)'}; expected ${expected}`);
  }
}

for (const file of files.filter((item) => /sitemap(?:-index)?\.xml$/.test(item))) {
  const name = relativeName(file);
  const relativeDirectory = relativeName(dirname(file)).replace(/^\.$/, '').replace(/\/$/, '');
  const scopePrefix = relativeDirectory === '' ? '/' : `/${relativeDirectory}/`;
  const xml = readFileSync(file, 'utf8');
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const pathname = localPath(match[1] ?? '');
    if (!pathname) {
      errors.push(`${name}: sitemap URL is outside ${topology.origin}`);
      continue;
    }
    if (scopePrefix !== '/' && !pathname.startsWith(scopePrefix)) {
      errors.push(`${name}: URL ${pathname} escapes sitemap directory ${scopePrefix}`);
    }
    if (!existsSync(artifactPath(pathname))) errors.push(`${name}: URL ${pathname} does not exist`);
  }
}

const robotsPath = join(root, 'robots.txt');
if (!existsSync(robotsPath)) {
  errors.push('robots.txt: missing from artifact root');
} else {
  const robots = readFileSync(robotsPath, 'utf8');
  for (const match of robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)) {
    const pathname = localPath(match[1] ?? '');
    if (!pathname || !existsSync(artifactPath(pathname))) {
      errors.push(`robots.txt: sitemap does not exist: ${match[1]}`);
    }
  }
}

for (const file of files.filter((item) => !relativeName(item).startsWith('noduct/'))) {
  if (readFileSync(file).includes(Buffer.from('/noduct/'))) {
    errors.push(`${relativeName(file)}: legacy /noduct/ reference outside transition stubs`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Pages validation passed for ${htmlFiles.length} HTML files and ${files.length} files.`
);
