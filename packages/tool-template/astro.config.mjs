import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { topology } from '@noduct/tool-runtime';
import { tool } from './src/config.ts';

// site e base vêm da topologia (ADR 0005) a partir do slug declarado em src/config.ts.
const { site, base } = topology.astro(tool.scope);

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [sitemap()],
  vite: {
    server: { strictPort: true, hmr: { path: `${base}/__vite_hmr` } },
    plugins: [{ name: 'noduct-dev-reload', handleHotUpdate(context) {
      context.server.ws.send({ type: 'full-reload' });
      return [];
    } }]
  },
  devToolbar: { enabled: false }
});
