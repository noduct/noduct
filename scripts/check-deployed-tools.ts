import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deployedTools } from './pages-manifest.ts';

const target = process.argv[2];
if (!target) throw new Error('Expected artifact directory or deployed URL.');
for (const tool of deployedTools()) {
  let mainHtml = '';
  for (const locale of ['', 'pt-br/', 'es/']) {
    const path = `${tool.slug}/${locale}index.html`;
    if (target.startsWith('http')) {
      const response = await fetch(`${target.replace(/\/$/, '')}/${tool.slug}/${locale}`);
      if (!response.ok) throw new Error(`Published ${path}: HTTP ${response.status}`);
      if (!locale) mainHtml = await response.text();
    } else if (!existsSync(join(target, path))) throw new Error(`Missing ${path}`);
    else if (!locale) mainHtml = readFileSync(join(target, path), 'utf8');
  }
  for (const extension of ['css', 'js']) {
    const asset = new RegExp(`/(?:${tool.slug})/_astro/[^"' ]+\\.${extension}`).exec(mainHtml)?.[0];
    if (!asset) throw new Error(`${tool.slug}: missing ${extension} asset reference`);
    if (target.startsWith('http')) {
      const response = await fetch(`${target.replace(/\/$/, '')}${asset}`);
      if (!response.ok) throw new Error(`Published ${asset}: HTTP ${response.status}`);
    } else if (!existsSync(join(target, asset.slice(1)))) throw new Error(`Missing ${asset}`);
  }
}
console.log(`Verified ${deployedTools().length} deployed tool(s).`);
