import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://noduct.github.io/example-tool', base: '/example-tool', output: 'static', integrations: [sitemap()] });
