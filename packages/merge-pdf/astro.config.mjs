import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://noduct.github.io/merge-pdf',
  base: '/merge-pdf',
  output: 'static',
  integrations: [sitemap()]
});

