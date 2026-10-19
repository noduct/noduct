import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { HUB_SCOPE, topology } from '@noduct/tool-runtime';

// site e base vêm da topologia (ADR 0005): hub na raiz da origem.
const { site, base } = topology.astro(HUB_SCOPE);
const isExcludedFromSitemap = (page) =>
  page.includes('/tool-template-demo/') ||
  /\/(?:(?:pt-br|es)\/)?404\/?$/.test(new URL(page).pathname);

export function devToolProxy(value = process.env.NODUCT_DEV_TOOLS ?? '') {
  /** @type {Record<string, import('vite').ProxyOptions>} */
  const proxy = {};
  for (const item of value.split(',').filter(Boolean)) {
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)=(\d+)$/.exec(item);
    if (!match) throw new Error(`Invalid NODUCT_DEV_TOOLS entry: ${item}`);
    const [, slug, port] = match;
    proxy[`/${slug}`] = {
      target: `http://127.0.0.1:${port}`,
      changeOrigin: true,
      ws: true,
      selfHandleResponse: true,
      configure(serverProxy) {
        serverProxy.on('proxyReq', (request) => request.setHeader('accept-encoding', 'identity'));
        serverProxy.on('proxyRes', (upstream, _request, response) => {
          const headers = { ...upstream.headers };
          const contentType = String(headers['content-type'] ?? '');
          if (!/(?:text\/html|javascript|text\/css)/.test(contentType)) {
            response.writeHead(upstream.statusCode ?? 502, headers);
            upstream.pipe(response);
            return;
          }
          const chunks = [];
          upstream.on('data', (chunk) => chunks.push(chunk));
          upstream.on('end', () => {
            const html = Buffer.concat(chunks)
              .toString('utf8')
              .replace(
                /(["'(=])\/(?:@vite|@fs|@id|src|node_modules|@astro)(?=\/)/g,
                (match) => `${match[0]}/${slug}${match.slice(1)}`
              );
            delete headers['content-length'];
            delete headers['content-encoding'];
            response.writeHead(upstream.statusCode ?? 502, headers);
            response.end(html);
          });
        });
      }
    };
  }
  return proxy;
}

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
