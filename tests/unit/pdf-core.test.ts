import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  CorruptedPdfError,
  OperationCancelledError,
  assessResources,
  inspectDocument,
  mergeDocuments
} from '@noduct/pdf-core';

async function createPdf(pages: number): Promise<ArrayBuffer> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage();
  return (await document.save()).buffer.slice(0) as ArrayBuffer;
}

describe('pdf-core', () => {
  it('inspects a valid PDF', async () => {
    await expect(inspectDocument(await createPdf(2))).resolves.toMatchObject({
      pageCount: 2,
      encrypted: false
    });
  });

  it('rejects non-PDF inputs', async () => {
    await expect(
      inspectDocument(new TextEncoder().encode('not a pdf').buffer)
    ).rejects.toBeInstanceOf(CorruptedPdfError);
  });

  it('merges documents in the requested order', async () => {
    const result = await mergeDocuments([
      { input: await createPdf(1) },
      { input: await createPdf(2) }
    ]);
    await expect(
      inspectDocument(result.bytes.slice().buffer as ArrayBuffer)
    ).resolves.toMatchObject({
      pageCount: 3
    });
  });

  it('honors cancellation before work starts', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      mergeDocuments([{ input: await createPdf(1) }, { input: await createPdf(1) }], {
        signal: controller.signal
      })
    ).rejects.toBeInstanceOf(OperationCancelledError);
  });

  it('blocks oversized inputs before parsing', async () => {
    await expect(
      assessResources([await createPdf(1)], {
        maxFileBytes: 1,
        maxTotalBytes: 10,
        maxPages: 10,
        maxFiles: 2
      })
    ).resolves.toMatchObject({ decision: 'blocked' });
  });
});
