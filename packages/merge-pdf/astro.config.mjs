import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { topology } from '@noduct/tool-runtime';
import { tool } from './src/config.ts';

// site e base vêm da topologia (ADR 0005): a ferramenta vive em /<slug>/ na mesma origem do hub.
const { site, base } = topology.astro(tool.scope);

export default defineConfig({
  site,
  base,
  output: 'static',
  vite: { server: { strictPort: true, hmr: { path: `${base}__vite_hmr` } } },
  integrations: [sitemap()]
});
