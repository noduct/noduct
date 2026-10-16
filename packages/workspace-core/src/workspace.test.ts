import { indexedDB } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  openWorkspace,
  WorkspaceClient,
  WorkspaceUnavailableError
} from './index';

describe('WorkspaceClient & IndexedDB Persistence', () => {
  let client: WorkspaceClient;

  beforeEach(async () => {
    // Open isolated database with fake-indexeddb
    client = await openWorkspace({ factory: indexedDB });
    await client.clearDocuments();
  });

  it('saves and retrieves documents with binary Blob payload', async () => {
    const blobContent = 'Sample PDF binary string';
    const blob = new Blob([blobContent], { type: 'application/pdf' });

    const saved = await client.saveDocument({
      name: 'invoice.pdf',
      blob,
      pageCount: 3,
      metadata: { source: 'unit-test' }
    });

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('invoice.pdf');
    expect(saved.size).toBe(blob.size);
    expect(saved.mimeType).toBe('application/pdf');
    expect(saved.pageCount).toBe(3);

    const retrieved = await client.getDocument(saved.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.name).toBe('invoice.pdf');

    const text = await retrieved?.blob.text();
    expect(text).toBe(blobContent);
  });

  it('lists documents in the workspace', async () => {
    await client.saveDocument({
      name: 'doc1.pdf',
      blob: new Blob(['1'], { type: 'application/pdf' })
    });
    await client.saveDocument({
      name: 'doc2.pdf',
      blob: new Blob(['2'], { type: 'application/pdf' })
    });

    const docs = await client.listDocuments();
    expect(docs).toHaveLength(2);
    expect(docs.map((d) => d.name)).toContain('doc1.pdf');
    expect(docs.map((d) => d.name)).toContain('doc2.pdf');
  });

  it('deletes an individual document and returns success status', async () => {
    const doc = await client.saveDocument({
      name: 'to-delete.pdf',
      blob: new Blob(['del'], { type: 'application/pdf' })
    });

    expect(await client.deleteDocument(doc.id)).toBe(true);
    expect(await client.getDocument(doc.id)).toBeUndefined();
    expect(await client.deleteDocument('non-existent-id')).toBe(false);
  });

  it('clears all documents from the workspace', async () => {
    await client.saveDocument({
      name: 'docA.pdf',
      blob: new Blob(['A'], { type: 'application/pdf' })
    });
    await client.saveDocument({
      name: 'docB.pdf',
      blob: new Blob(['B'], { type: 'application/pdf' })
    });

    await client.clearDocuments();
    const docs = await client.listDocuments();
    expect(docs).toHaveLength(0);
  });

  it('calculates workspace usage size correctly', async () => {
    const blob1 = new Blob(['12345'], { type: 'application/pdf' }); // 5 bytes
    const blob2 = new Blob(['1234567890'], { type: 'application/pdf' }); // 10 bytes

    await client.saveDocument({ name: 'doc1.pdf', blob: blob1 });
    await client.saveDocument({ name: 'doc2.pdf', blob: blob2 });

    const size = await client.getWorkspaceSize();
    expect(size.documentCount).toBe(2);
    expect(size.totalBytes).toBe(15);
  });

  it('saves and reads state records', async () => {
    await client.setState('lastToolUsed', 'merge-pdf');
    const value = await client.getState('lastToolUsed');
    expect(value).toBe('merge-pdf');

    expect(await client.getState('unknownKey')).toBeUndefined();
  });

  it('notifies listeners on mutations', async () => {
    const listener = vi.fn();
    const unsubscribe = client.subscribe(listener);

    const doc = await client.saveDocument({
      name: 'event.pdf',
      blob: new Blob(['event'], { type: 'application/pdf' })
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document_added',
        documentId: doc.id
      })
    );

    await client.deleteDocument(doc.id);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document_deleted',
        documentId: doc.id
      })
    );

    unsubscribe();
    await client.clearDocuments();
    // After unsubscribe, listener should not be called for workspace_cleared
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workspace_cleared'
      })
    );
  });

  it('throws WorkspaceUnavailableError when factory is not available', async () => {
    const badFactory = {
      open: () => {
        throw new Error('Access denied');
      }
    } as unknown as IDBFactory;

    await expect(openWorkspace({ factory: badFactory })).rejects.toThrow(WorkspaceUnavailableError);
  });
});

