import { performance } from 'node:perf_hooks';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

const fixtureDirectory = new URL('../fixtures/', import.meta.url);
const fixtureName = process.argv[2] ?? 'medium-100-pages.pdf';
const source = await readFile(new URL(fixtureName, fixtureDirectory));

async function measure(operation, execute) {
  global.gc?.();
  const before = process.memoryUsage();
  const started = performance.now();
  const result = await execute();
  const elapsedMs = performance.now() - started;
  const after = process.memoryUsage();
  return {
    operation,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    outputBytes: result.length,
    rssDeltaBytes: after.rss - before.rss,
    heapUsedDeltaBytes: after.heapUsed - before.heapUsed
  };
}

const metrics = [];
metrics.push(
  await measure('merge-two-documents', async () => {
    const output = await PDFDocument.create();
    for (const bytes of [source, source]) {
      const input = await PDFDocument.load(bytes);
      const pages = await output.copyPages(input, input.getPageIndices());
      pages.forEach((page) => output.addPage(page));
    }
    return output.save();
  })
);

metrics.push(
  await measure('extract-odd-pages', async () => {
    const input = await PDFDocument.load(source);
    const output = await PDFDocument.create();
    const indexes = input.getPageIndices().filter((index) => index % 2 === 0);
    const pages = await output.copyPages(input, indexes);
    pages.forEach((page) => output.addPage(page));
    return output.save();
  })
);

metrics.push(
  await measure('reorder-and-rotate', async () => {
    const input = await PDFDocument.load(source);
    const output = await PDFDocument.create();
    const indexes = [...input.getPageIndices()].reverse();
    const pages = await output.copyPages(input, indexes);
    pages.forEach((page) => {
      page.setRotation({ type: 'degrees', angle: 90 });
      output.addPage(page);
    });
    return output.save();
  })
);

console.log(
  JSON.stringify(
    {
      engine: 'pdf-lib@1.17.1',
      runtime: process.version,
      fixture: fixtureName,
      fixtureBytes: source.length,
      metrics
    },
    null,
    2
  )
);
