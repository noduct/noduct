import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tolvira.github.io/tolvira',
  base: '/tolvira',
  output: 'static',
  integrations: [sitemap({ filter: (page) => !page.includes('/tool-template-demo/') })],
  build: { format: 'directory' },
  devToolbar: {
    enabled: false
  }
});
