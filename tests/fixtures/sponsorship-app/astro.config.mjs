import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  base: '/',
  output: 'static',
  outDir: '../../../.sponsorship-fixture',
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
