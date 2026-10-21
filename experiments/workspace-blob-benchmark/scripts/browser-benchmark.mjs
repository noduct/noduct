import { createServer } from 'node:http';
import { chromium, firefox, webkit } from '@playwright/test';

// Compara o toque de metadados do schema v3 (registro com Blob) com o v4 (Blob em store separada).
const SIZES_MB = (process.env.SIZES_MB ?? '1,10,50,100').split(',').map(Number);
const ROUNDS = Number(process.env.ROUNDS ?? 7);

const server = createServer((_, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end('<!doctype html><title>bench</title>');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}/`;
const outcomes = [];

for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
  if (process.env.BROWSERS && !process.env.BROWSERS.split(',').includes(name)) continue;
  try {
    const browser = await browserType.launch();
    const page = await browser.newPage();
    await page.goto(origin);
    const metrics = await page.evaluate(
      async ({ sizes, rounds }) => {
        const promisify = (request) =>
          new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        const done = (tx) =>
          new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
          });
        const open = (dbName) =>
          new Promise((resolve, reject) => {
            const request = globalThis.indexedDB.open(dbName, 1);
            request.onupgradeneeded = () => {
              request.result.createObjectStore('documents', { keyPath: 'id' });
              request.result.createObjectStore('document_blobs', { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        const median = (values) => {
          const sorted = [...values].sort((a, b) => a - b);
          return +sorted[Math.floor(sorted.length / 2)].toFixed(2);
        };
        const usage = async () => (await navigator.storage.estimate()).usage ?? 0;
        const results = [];
        for (const sizeMb of sizes) {
          const bytes = new Uint8Array(sizeMb * 1024 * 1024);
          for (let index = 0; index < bytes.length; index += 4096) bytes[index] = index % 251;
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const meta = { id: 'doc', name: 'bench.pdf', size: blob.size, lastAccessedAt: 0 };
          for (const layout of ['v3', 'v4']) {
            const dbName = `bench-${layout}-${sizeMb}`;
            const db = await open(dbName);
            let tx = db.transaction(['documents', 'document_blobs'], 'readwrite');
            if (layout === 'v3') tx.objectStore('documents').put({ ...meta, blob });
            else {
              tx.objectStore('documents').put(meta);
              tx.objectStore('document_blobs').put({ id: 'doc', blob });
            }
            await done(tx);
            const before = await usage();
            const timings = [];
            for (let round = 1; round <= rounds; round += 1) {
              const started = performance.now();
              tx = db.transaction('documents', 'readwrite');
              const store = tx.objectStore('documents');
              const record = await promisify(store.get('doc'));
              store.put({ ...record, lastAccessedAt: round });
              await done(tx);
              timings.push(performance.now() - started);
            }
            const after = await usage();
            results.push({
              sizeMb,
              layout,
              touchMedianMs: median(timings),
              touchMaxMs: +Math.max(...timings).toFixed(2),
              storageGrowthMb: +((after - before) / 1024 / 1024).toFixed(2)
            });
            db.close();
            await promisify(globalThis.indexedDB.deleteDatabase(dbName));
          }
        }
        return results;
      },
      { sizes: SIZES_MB, rounds: ROUNDS }
    );
    outcomes.push({ browser: name, version: browser.version(), status: 'measured', metrics });
    await browser.close();
  } catch (error) {
    outcomes.push({
      browser: name,
      status: 'not-measured',
      reason: error instanceof Error ? error.message.split('\n')[0] : String(error)
    });
  }
}

server.close();
console.log(JSON.stringify({ rounds: ROUNDS, outcomes }, null, 2));
