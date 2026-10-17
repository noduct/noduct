import { indexedDB } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { topology } from '@noduct/tool-runtime';
import {
  DocumentNotFoundError,
  InvalidToolTargetError,
  openWorkspace,
  TransferAlreadyConsumedError,
  TransferExpiredError,
  TransferNotFoundError,
  WorkspaceClient
} from './index';

describe('Cross-Tool Transfer Protocol', () => {
  let client: WorkspaceClient;

  beforeEach(async () => {
    client = await openWorkspace({ factory: indexedDB });
    await client.clearDocuments();
    await client.clearTransfers();
  });

  it('creates a transfer ticket and generates a clean opaque URL', async () => {
    const doc = await client.saveDocument({
      name: 'report.pdf',
      blob: new Blob(['report-data'], { type: 'application/pdf' })
    });

    const transfer = await client.createTransfer(doc.id, 'merge-pdf');

    expect(transfer.transferId).toBeDefined();
    expect(transfer.transferUrl).toBe(
      `${topology.toolUrl('merge-pdf')}?transferId=${transfer.transferId}`
    );
    expect(transfer.expiresAt).toBeGreaterThan(Date.now());
  });

  it('preserves the user locale and rejects invalid targets', async () => {
    const doc = await client.saveDocument({
      name: 'a.pdf',
      blob: new Blob(['a'], { type: 'application/pdf' })
    });
    const transfer = await client.createTransfer(doc.id, 'merge-pdf', { locale: 'pt-BR' });
    expect(transfer.transferUrl).toBe(
      `${topology.toolUrl('merge-pdf', '', 'pt-BR')}?transferId=${transfer.transferId}`
    );
    await expect(client.createTransfer(doc.id, 'about')).rejects.toThrow(InvalidToolTargetError);
    await expect(client.createTransfer(doc.id, '../x')).rejects.toThrow(InvalidToolTargetError);
  });

  it('fails to create transfer if document does not exist', async () => {
    await expect(client.createTransfer('non-existent-id', 'merge-pdf')).rejects.toMatchObject({
      code: 'DOCUMENT_NOT_FOUND',
      params: { id: 'non-existent-id' }
    } satisfies Partial<DocumentNotFoundError>);
  });

  it('resolves a transfer ticket once and blocks reuse', async () => {
    const doc = await client.saveDocument({
      name: 'invoice.pdf',
      blob: new Blob(['invoice-binary'], { type: 'application/pdf' })
    });

    const transfer = await client.createTransfer(doc.id, 'split-pdf');

    // First resolution succeeds
    const resolved = await client.resolveTransfer(transfer.transferId, 'split-pdf');
    expect(resolved.id).toBe(doc.id);
    expect(resolved.name).toBe('invoice.pdf');
    expect(await resolved.blob.text()).toBe('invoice-binary');

    // Second resolution fails with TransferAlreadyConsumedError
    await expect(client.resolveTransfer(transfer.transferId, 'split-pdf')).rejects.toThrow(
      TransferAlreadyConsumedError
    );
  });

  it('rejects expired transfer tickets', async () => {
    const doc = await client.saveDocument({
      name: 'expired.pdf',
      blob: new Blob(['data'], { type: 'application/pdf' })
    });

    // 1ms TTL
    const transfer = await client.createTransfer(doc.id, 'merge-pdf', { ttlMs: 1 });

    // Wait 10ms
    await new Promise((r) => setTimeout(r, 10));

    await expect(client.resolveTransfer(transfer.transferId, 'merge-pdf')).rejects.toThrow(
      TransferExpiredError
    );
  });

  it('rejects transfers accessed from the wrong tool', async () => {
    const doc = await client.saveDocument({
      name: 'doc.pdf',
      blob: new Blob(['content'], { type: 'application/pdf' })
    });

    const transfer = await client.createTransfer(doc.id, 'pdf-studio');

    await expect(client.resolveTransfer(transfer.transferId, 'merge-pdf')).rejects.toThrow(
      InvalidToolTargetError
    );
  });

  it('rejects unknown transferId', async () => {
    await expect(client.resolveTransfer('random-ticket-id')).rejects.toMatchObject({
      code: 'TRANSFER_NOT_FOUND',
      params: { transferId: 'random-ticket-id' }
    } satisfies Partial<TransferNotFoundError>);
  });

  it('cleans up expired and consumed transfers', async () => {
    const doc = await client.saveDocument({
      name: 'clean.pdf',
      blob: new Blob(['abc'], { type: 'application/pdf' })
    });

    // Create 1 consumed and 1 expired
    const t1 = await client.createTransfer(doc.id, 'merge-pdf');
    await client.resolveTransfer(t1.transferId, 'merge-pdf'); // consumed

    await client.createTransfer(doc.id, 'merge-pdf', { ttlMs: 1 });
    await new Promise((r) => setTimeout(r, 10)); // expired

    const cleaned = await client.cleanupExpiredTransfers();
    expect(cleaned).toBe(2);
  });
});
