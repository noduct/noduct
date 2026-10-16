import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const fixturesDirectory = fileURLToPath(new URL('../fixtures/', import.meta.url));
await mkdir(fixturesDirectory, { recursive: true });

async function createFixture(name, pageCount) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);

  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage(index % 2 === 0 ? [595, 842] : [842, 595]);
    page.drawText(`Tolvira benchmark fixture — page ${index + 1}`, {
      x: 48,
      y: page.getHeight() - 72,
      font,
      size: 16,
      color: rgb(0.08, 0.2, 0.36)
    });
  }

  await writeFile(join(fixturesDirectory, name), await document.save());
}

await createFixture('small-10-pages.pdf', 10);
await createFixture('medium-100-pages.pdf', 100);
console.log(`Fixtures written to ${fixturesDirectory}`);
