import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tolvira.github.io',
  output: 'static',
  integrations: [sitemap({ filter: (page) => !page.includes('/tool-template-demo/') })],
  build: { format: 'directory' }
});
