import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

const vitePath = /(["'(=])\/(?:@vite|@fs|@id|src|node_modules|@astro)(?=\/)/g;

export function rewriteDevPaths(source, slug) {
  return source.replace(vitePath, (match) => `${match[0]}/${slug}${match.slice(1)}`);
}

export function rewriteStream(slug) {
  const decoder = new StringDecoder('utf8');
  let pending = '';
  return new Transform({
    transform(chunk, _encoding, callback) {
      pending += decoder.write(chunk);
      if (pending.length > 96) {
        let cut = pending.length - 64;
        for (const delimiter of ['"', "'", '(', '=']) {
          const index = pending.lastIndexOf(delimiter, cut - 1);
          if (index >= cut - 32) cut = Math.min(cut, index);
        }
        this.push(rewriteDevPaths(pending.slice(0, cut), slug));
        pending = pending.slice(cut);
      }
      callback();
    },
    flush(callback) {
      this.push(rewriteDevPaths(pending + decoder.end(), slug));
      callback();
    }
  });
}

/** Proxy por segmento; respostas textuais são reescritas em fluxo até o Astro expor base de dev. */
export function devToolProxy(value = process.env.NODUCT_DEV_TOOLS ?? '') {
  /** @type {Record<string, import('vite').ProxyOptions>} */
  const proxy = {};
  for (const item of value.split(',').filter(Boolean)) {
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)=(\d+)$/.exec(item);
    if (!match) throw new Error(`Invalid NODUCT_DEV_TOOLS entry: ${item}`);
    const [, slug, port] = match;
    proxy[`^/${slug}(?:[/?#]|$)`] = {
      target: `http://127.0.0.1:${port}`,
      changeOrigin: true,
      ws: true,
      selfHandleResponse: true,
      configure(serverProxy) {
        serverProxy.on('proxyReq', (request) => request.setHeader('accept-encoding', 'identity'));
        serverProxy.on('proxyRes', (upstream, _request, response) => {
          const headers = { ...upstream.headers };
          const type = String(headers['content-type'] ?? '');
          const textual = /(?:text\/html|javascript|text\/css)/.test(type);
          const encoded = headers['content-encoding'] && headers['content-encoding'] !== 'identity';
          const fail = (error) => {
            if (!response.headersSent) response.writeHead(502);
            response.destroy(error);
          };
          upstream.on('error', fail);
          response.once('close', () => {
            if (!response.writableEnded) upstream.destroy();
          });
          if (!textual || encoded) {
            response.writeHead(upstream.statusCode ?? 502, headers);
            upstream.pipe(response);
            return;
          }
          delete headers['content-length'];
          delete headers['content-encoding'];
          response.writeHead(upstream.statusCode ?? 502, headers);
          const transform = rewriteStream(slug);
          transform.on('error', fail);
          upstream.pipe(transform).pipe(response);
        });
      }
    };
  }
  return proxy;
}
