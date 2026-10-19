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
  // O PDF.js das miniaturas (ADR 0006) é importado sob demanda; pré-otimizado, o dev não
  // descobre a dependência no meio da sessão e não serve "Outdated Optimize Dep".
  vite: {
    optimizeDeps: { include: ['pdfjs-dist/legacy/build/pdf.mjs'] },
    server: { strictPort: true, hmr: { path: `${base}__vite_hmr` } }
  },
  integrations: [sitemap()]
});
