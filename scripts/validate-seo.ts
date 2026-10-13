import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1');
const htmlFiles: string[] = [];
async function walk(dir: string) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else if (entry.name.endsWith('.html')) htmlFiles.push(path); } }
await walk(root);
const errors: string[] = []; const titles = new Map<string, string>();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8'); const name = relative(root, file);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (!title) errors.push(`${name}: missing title`); else if (titles.has(title)) errors.push(`${name}: duplicate title with ${titles.get(title)}`); else titles.set(title, name);
  if (!description) errors.push(`${name}: missing meta description`);
  if (!canonical?.startsWith('https://tolvira.github.io/')) errors.push(`${name}: invalid canonical`);
  if (h1Count !== 1) errors.push(`${name}: expected one H1, found ${h1Count}`);
}
for (const asset of ['robots.txt', 'sitemap-index.xml']) { try { await readFile(join(root, asset)); } catch { errors.push(`Missing ${asset}`); } }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`SEO validation passed for ${htmlFiles.length} HTML files.`);
