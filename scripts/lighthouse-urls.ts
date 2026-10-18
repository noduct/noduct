import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deployedTools, rootDir } from './pages-manifest.ts';

const catalog = JSON.parse(readFileSync(join(rootDir, 'src/data/tools.json'), 'utf8')) as Array<{
  slug: string;
  status: string;
}>;
const paths = ['/', '/tools/', '/pdf-tools/', '/sponsor/'].map((path) => ({
  path,
  indexable: true
}));
for (const tool of deployedTools()) {
  const entry = catalog.find((item) => item.slug === tool.slug);
  if (!entry) throw new Error(`Missing catalog entry for Lighthouse tool ${tool.slug}`);
  paths.push({ path: `/${tool.slug}/`, indexable: entry.status !== 'planned' });
}
console.log(JSON.stringify(paths));
