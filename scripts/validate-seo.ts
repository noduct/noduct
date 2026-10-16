import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { topology } from '@noduct/tool-runtime';

const defaultRoot = new URL('../dist-pages/', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1');
const root = resolve(process.argv[2] ?? defaultRoot);
const htmlFiles: string[] = [];

async function walk(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (relative(root, path).split(sep)[0] !== 'noduct') await walk(path);
    } else if (entry.name.endsWith('.html')) {
      htmlFiles.push(path);
    }
  }
}

function pagePath(file: string): string {
  const name = relative(root, file).split(sep).join('/');
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return `/${name.slice(0, -'index.html'.length)}`;
  return `/${name}`;
}

await walk(root);
const errors: string[] = [];
const titlesByLanguage = new Map<string, Map<string, string>>();

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const name = relative(root, file).split(sep).join('/');
  if (/(^|\/)404(?:\/index)?\.html$/.test(name)) continue;

  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? '(missing)';
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(
    /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']+)["']/i
  )?.[1];
  const canonical =
    html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1] ??
    html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i)?.[1];
  const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;

  if (!title) {
    errors.push(`${name}: missing title`);
  } else {
    const titles = titlesByLanguage.get(language) ?? new Map<string, string>();
    if (titles.has(title))
      errors.push(`${name}: duplicate ${language} title with ${titles.get(title)}`);
    else titles.set(title, name);
    titlesByLanguage.set(language, titles);
  }
  if (language === '(missing)') errors.push(`${name}: missing html lang`);
  if (!description) errors.push(`${name}: missing meta description`);
  const expectedCanonical = `${topology.origin}${pagePath(file)}`;
  if (canonical !== expectedCanonical) {
    errors.push(`${name}: canonical ${canonical ?? '(missing)'}; expected ${expectedCanonical}`);
  }
  if (h1Count !== 1) errors.push(`${name}: expected one H1, found ${h1Count}`);
}

for (const asset of ['robots.txt', 'sitemap-index.xml']) {
  try {
    await readFile(join(root, asset));
  } catch {
    errors.push(`Missing ${asset}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`SEO validation passed for ${htmlFiles.length} HTML files.`);
