import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve('dist-pages');
const port = Number(process.env.PORT ?? 4321);
const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript',
  // O worker do PDF.js é emitido como .mjs; o GitHub Pages o serve como JavaScript.
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

if (!existsSync(join(root, 'index.html'))) {
  throw new Error('dist-pages/index.html is missing. Run npm run build first.');
}

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  const target = resolve(root, `.${pathname}`);
  const pathFromRoot = relative(root, target);
  if (
    pathFromRoot.startsWith(`..${sep}`) ||
    pathFromRoot === '..' ||
    pathFromRoot.startsWith(sep)
  ) {
    response.writeHead(403).end();
    return;
  }

  let file = target;
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      response
        .writeHead(308, {
          location: `${pathname}/${new URL(request.url ?? '/', 'http://localhost').search}`
        })
        .end();
      return;
    }
    file = join(file, 'index.html');
  }
  let status = 200;
  if (!existsSync(file) || !statSync(file).isFile()) {
    if (request.headers.accept?.includes('text/html')) {
      file = join(root, '404.html');
      status = 404;
    } else {
      response.writeHead(404).end();
      return;
    }
  }
  response.writeHead(status, {
    'content-type': `${mimeTypes[extname(file)] ?? 'application/octet-stream'}; charset=utf-8`,
    'cache-control': 'no-store'
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`pages artifact ready at http://127.0.0.1:${port}/`);
});
