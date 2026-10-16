import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { MergeWorkflow } from './merge-workflow';

async function createDummyPdf(pages: number, name = 'test.pdf'): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage();
  const bytes = await doc.save();
  return new File([bytes.buffer as ArrayBuffer], name, { type: 'application/pdf' });
}

describe('MergeWorkflow', () => {
  it('manages file addition, validation and canMerge status', async () => {
    const workflow = new MergeWorkflow();
    expect(workflow.getState().canMerge).toBe(false);

    const file1 = await createDummyPdf(2, 'doc1.pdf');
    await workflow.addFiles([file1]);

    let state = workflow.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.pageCount).toBe(2);
    expect(state.items[0]?.status).toBe('valid');
    expect(state.canMerge).toBe(false);

    const file2 = await createDummyPdf(3, 'doc2.pdf');
    await workflow.addFiles([file2]);

    state = workflow.getState();
    expect(state.items).toHaveLength(2);
    expect(state.canMerge).toBe(true);
    expect(state.totalPages).toBe(5);
  });

  it('marks corrupted non-PDF files without breaking other files', async () => {
    const workflow = new MergeWorkflow();
    const valid = await createDummyPdf(1, 'valid.pdf');
    const bad = new File(['not a pdf'], 'bad.txt', { type: 'application/pdf' });

    await workflow.addFiles([valid, bad]);

    const state = workflow.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items[0]?.status).toBe('valid');
    expect(state.items[1]?.status).toBe('corrupted');
    expect(state.canMerge).toBe(false); // needs 2 valid files

    // Removing bad file restores proper state
    workflow.removeItem(state.items[1]!.id);
    expect(workflow.getState().items).toHaveLength(1);
  });

  it('reorders items properly', async () => {
    const workflow = new MergeWorkflow();
    const file1 = await createDummyPdf(1, 'first.pdf');
    const file2 = await createDummyPdf(2, 'second.pdf');
    await workflow.addFiles([file1, file2]);

    const ids = workflow.getState().items.map((i) => i.id);
    workflow.reorder([ids[1]!, ids[0]!]);

    const names = workflow.getState().items.map((i) => i.name);
    expect(names).toEqual(['second.pdf', 'first.pdf']);
  });

  it('executes merge and produces a valid output Blob', async () => {
    const workflow = new MergeWorkflow();
    const file1 = await createDummyPdf(1, 'a.pdf');
    const file2 = await createDummyPdf(2, 'b.pdf');
    await workflow.addFiles([file1, file2]);

    let progressRecorded = false;
    const result = await workflow.executeMerge({
      onProgress: (p) => {
        if (p.percent >= 0) progressRecorded = true;
      }
    });

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBeGreaterThan(0);
    expect(progressRecorded).toBe(true);
  });

  it('aborts merge execution when cancel is called', async () => {
    const workflow = new MergeWorkflow();
    const file1 = await createDummyPdf(1, 'a.pdf');
    const file2 = await createDummyPdf(2, 'b.pdf');
    await workflow.addFiles([file1, file2]);

    const mergePromise = workflow.executeMerge({ stepDelayMs: 200 });
    expect(workflow.getState().isMerging).toBe(true);

    workflow.cancel();

    await expect(mergePromise).rejects.toThrow();
    expect(workflow.getState().isMerging).toBe(false);
  });
});
