import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { HUB_SCOPE, topology } from '@noduct/tool-runtime';
import { devToolProxy } from './scripts/dev-proxy.mjs';

// site e base vêm da topologia (ADR 0005): hub na raiz da origem.
const { site, base } = topology.astro(HUB_SCOPE);
const isExcludedFromSitemap = (page) =>
  page.includes('/tool-template-demo/') ||
  /\/(?:(?:pt-br|es)\/)?404\/?$/.test(new URL(page).pathname);

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [sitemap({ filter: (page) => !isExcludedFromSitemap(page) })],
  build: { format: 'directory' },
  // O PDF.js das miniaturas (ADR 0006) é importado sob demanda; pré-otimizado, o dev não
  // descobre a dependência no meio da sessão e não serve "Outdated Optimize Dep".
  vite: {
    optimizeDeps: { include: ['pdfjs-dist/legacy/build/pdf.mjs'] },
    server: { strictPort: true, proxy: devToolProxy() }
  },
  devToolbar: {
    enabled: false
  }
});
