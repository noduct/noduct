import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from '@playwright/test';

const libraryPath = fileURLToPath(
  new URL('../node_modules/pdf-lib/dist/pdf-lib.min.js', import.meta.url)
);
const library = await readFile(libraryPath);
const bundle = { rawBytes: library.length, gzipBytes: gzipSync(library).length };
const outcomes = [];

for (const [name, browserType] of Object.entries({ chromium, firefox, webkit })) {
  try {
    const browser = await browserType.launch();
    const page = await browser.newPage();
    await page.addScriptTag({ path: libraryPath });
    const metrics = await page.evaluate(async () => {
      const create = async (pages) => {
        const document = await PDFLib.PDFDocument.create();
        for (let index = 0; index < pages; index += 1) document.addPage();
        return document.save();
      };
      const source = await create(100);
      const measure = async (operation, fn) => {
        const started = performance.now();
        const bytes = await fn();
        return {
          operation,
          elapsedMs: +(performance.now() - started).toFixed(2),
          outputBytes: bytes.length
        };
      };
      return Promise.all([
        measure('merge-two-documents', async () => {
          const out = await PDFLib.PDFDocument.create();
          for (const bytes of [source, source]) {
            const input = await PDFLib.PDFDocument.load(bytes);
            const pages = await out.copyPages(input, input.getPageIndices());
            pages.forEach((item) => out.addPage(item));
          }
          return out.save();
        }),
        measure('extract-odd-pages', async () => {
          const input = await PDFLib.PDFDocument.load(source);
          const out = await PDFLib.PDFDocument.create();
          const pages = await out.copyPages(
            input,
            input.getPageIndices().filter((index) => index % 2 === 0)
          );
          pages.forEach((item) => out.addPage(item));
          return out.save();
        })
      ]);
    });
    outcomes.push({ browser: name, status: 'measured', metrics });
    await browser.close();
  } catch (error) {
    outcomes.push({
      browser: name,
      status: 'not-measured',
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

console.log(JSON.stringify({ engine: 'pdf-lib@1.17.1', bundle, outcomes }, null, 2));
