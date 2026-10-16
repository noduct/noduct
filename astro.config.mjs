import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { HUB_SCOPE, topology } from '@noduct/tool-runtime';

// site e base vêm da topologia (ADR 0005): hub na raiz da origem.
const { site, base } = topology.astro(HUB_SCOPE);
const isExcludedFromSitemap = (page) =>
  page.includes('/tool-template-demo/') || /\/(?:(?:pt-br|es)\/)?404\/?$/.test(new URL(page).pathname);

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [sitemap({ filter: (page) => !isExcludedFromSitemap(page) })],
  build: { format: 'directory' },
  devToolbar: {
    enabled: false
  }
});
