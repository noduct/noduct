import { IDBFactory, indexedDB } from 'fake-indexeddb';
import { openDatabase } from './db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_DOCUMENT_MAX_IDLE_MS,
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

  afterEach(() => {
    client.close();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

function stubLocks(held = new Set<string>()): void {
  vi.stubGlobal('navigator', {
    locks: {
      request: async <T>(
        name: string,
        options: { ifAvailable?: boolean },
        callback: (lock: { name: string } | null) => Promise<T>
      ) => callback(options.ifAvailable && held.has(name) ? null : { name })
    }
  });
}

describe('Workspace document retention', () => {
  let client: WorkspaceClient;
  const factory = new IDBFactory();
  const base = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(base);
    stubLocks();
    client = await openWorkspace({ factory });
    await client.clearDocuments();
  });

  afterEach(() => {
    client.close();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('expires ephemeral documents only at the 24-hour boundary and emits deletion', async () => {
    const doc = await client.saveDocument({ name: 'temporary.pdf', blob: new Blob(['pdf']) });
    const listener = vi.fn();
    client.subscribe(listener);
    expect(doc.retention).toBe('ephemeral');
    expect(doc.lastAccessedAt).toBe(base.getTime());
    expect(
      await client.cleanupExpiredDocuments(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS)
    ).toEqual([]);
    expect(
      await client.cleanupExpiredDocuments(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1)
    ).toEqual([doc.id]);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'document_deleted', documentId: doc.id, reason: 'expired' })
    );
    expect(await client.listDocuments()).toEqual([]);
  });

  it('resets idle time on get and transfer, and preserves chosen retention on update', async () => {
    const doc = await client.saveDocument({ name: 'read.pdf', blob: new Blob(['pdf']) });
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS - 1);
    expect((await client.getDocument(doc.id))?.lastAccessedAt).toBe(Date.now());
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    expect(await client.cleanupExpiredDocuments()).toEqual([]);
    const transfer = await client.createTransfer(doc.id, 'merge-pdf');
    expect((await client.resolveTransfer(transfer.transferId, 'merge-pdf')).id).toBe(doc.id);
    const kept = await client.setRetention(doc.id, 'persistent');
    expect(kept.retention).toBe('persistent');
    expect(kept.updatedAt).toBe(doc.updatedAt);
    await client.saveDocument({ id: doc.id, name: 'updated.pdf', blob: new Blob(['updated']) });
    expect((await client.listDocuments())[0]?.retention).toBe('persistent');
    vi.setSystemTime(base.getTime() + 7 * DEFAULT_DOCUMENT_MAX_IDLE_MS);
    expect(await client.cleanupExpiredDocuments()).toEqual([]);
    const temporary = await client.setRetention(doc.id, 'ephemeral');
    expect(temporary.lastAccessedAt).toBe(Date.now());
    expect(await client.cleanupExpiredDocuments(Date.now() + DEFAULT_DOCUMENT_MAX_IDLE_MS)).toEqual(
      []
    );
    expect(
      await client.cleanupExpiredDocuments(Date.now() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1)
    ).toEqual([doc.id]);
  });

  it('skips a document locked by another tab and deletes it after the lock is released', async () => {
    const held = new Set<string>();
    stubLocks(held);
    const doc = await client.saveDocument({ name: 'active.pdf', blob: new Blob(['pdf']) });
    held.add(`noduct-doc-${doc.id}`);
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    expect(await client.cleanupExpiredDocuments()).toEqual([]);
    expect(await client.listDocuments()).toHaveLength(1);
    held.clear();
    expect(await client.cleanupExpiredDocuments()).toEqual([doc.id]);
  });

  it('keeps an acquired document until release, then allows expiration', async () => {
    const held = new Map<string, number>();
    vi.stubGlobal('navigator', {
      locks: {
        request: async <T>(
          name: string,
          options: { mode: 'shared' | 'exclusive'; ifAvailable?: boolean },
          callback: (lock: { name: string } | null) => Promise<T>
        ): Promise<T> => {
          if (options.mode === 'exclusive' && options.ifAvailable && held.has(name))
            return callback(null);
          held.set(name, (held.get(name) ?? 0) + 1);
          try {
            return await callback({ name });
          } finally {
            const count = (held.get(name) ?? 1) - 1;
            if (count) held.set(name, count);
            else held.delete(name);
          }
        }
      }
    });
    const doc = await client.saveDocument({ name: 'active.pdf', blob: new Blob(['pdf']) });
    const session = await client.acquireDocument(doc.id);
    expect(session.document.id).toBe(doc.id);
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    expect(await client.cleanupExpiredDocuments()).toEqual([]);
    session.release();
    await vi.waitFor(() => expect(held.has(`noduct-doc-${doc.id}`)).toBe(false));
    expect(await client.cleanupExpiredDocuments()).toEqual([doc.id]);
  });

  it('allows a nested read under a shared document lock', async () => {
    let exclusive = false;
    let shared = 0;
    vi.stubGlobal('navigator', { locks: {
      request: async <T>(
        name: string,
        options: { mode: 'shared' | 'exclusive'; ifAvailable?: boolean },
        callback: (lock: { name: string } | null) => Promise<T>
      ): Promise<T> => {
        if (options.ifAvailable && (exclusive || shared > 0)) return callback(null);
        while (exclusive || (options.mode === 'exclusive' && shared > 0))
          await new Promise((resolve) => setTimeout(resolve, 1));
        if (options.mode === 'exclusive') exclusive = true;
        else shared++;
        try { return await callback({ name }); }
        finally {
          if (options.mode === 'exclusive') exclusive = false;
          else shared--;
        }
      }
    } });
    const doc = await client.saveDocument({ name: 'nested.pdf', blob: new Blob(['pdf']) });
    const result = await Promise.race([
      client.withDocumentLock(doc.id, () => client.getDocument(doc.id)),
      new Promise<undefined>((_, reject) =>
        setTimeout(() => reject(new Error('lock timeout')), 500)
      )
    ]);
    expect(result?.id).toBe(doc.id);
  });

  it('does not auto-delete without cross-tab Web Locks', async () => {
    const doc = await client.saveDocument({ name: 'safe.pdf', blob: new Blob(['pdf']) });
    vi.stubGlobal('navigator', {});
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    expect(await client.cleanupExpiredDocuments()).toEqual([]);
    expect(await client.listDocuments()).toHaveLength(1);
    expect((await client.getDocument(doc.id))?.id).toBe(doc.id);
  });

  it('cleans on open and returns the removed IDs for the UI announcement', async () => {
    const doc = await client.saveDocument({ name: 'old.pdf', blob: new Blob(['pdf']) });
    client.close();
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    client = await openWorkspace({ factory });
    expect(client.initialCleanupRemovedIds).toEqual([doc.id]);
    expect(await client.listDocuments()).toEqual([]);
  });

  it('cleans when the page becomes visible and unregisters the listener on close', async () => {
    const page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    vi.stubGlobal('document', page);
    client.close();
    client = await openWorkspace({ factory });
    const doc = await client.saveDocument({ name: 'background.pdf', blob: new Blob(['pdf']) });
    const listener = vi.fn();
    client.subscribe(listener);
    vi.setSystemTime(base.getTime() + DEFAULT_DOCUMENT_MAX_IDLE_MS + 1);
    page.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() =>
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'document_deleted', documentId: doc.id })
      )
    );
    expect(await client.listDocuments()).toEqual([]);
    const afterClose = vi.spyOn(client, 'cleanupExpiredDocuments');
    client.close();
    page.dispatchEvent(new Event('visibilitychange'));
    expect(afterClose).not.toHaveBeenCalled();
  });
});

describe('Workspace schema migration', () => {
  it('reports a newer unsupported schema', async () => {
    const factory = new IDBFactory();
    const newer = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('noduct_workspace_db', CURRENT_SCHEMA_VERSION + 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    newer.close();
    await expect(openDatabase(factory)).rejects.toMatchObject({
      code: 'SCHEMA_VERSION_UNSUPPORTED'
    });
  });

  it('reports an upgrade blocked by an older open tab', async () => {
    const factory = new IDBFactory();
    const old = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('noduct_workspace_db', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await expect(openDatabase(factory)).rejects.toMatchObject({ code: 'DB_UPGRADE_BLOCKED' });
    } finally {
      old.close();
    }
  });
  it('upgrades v2 documents to ephemeral with updatedAt as the idle start and preserves blobs', async () => {
    const factory = new IDBFactory();
    const oldTimestamp = Date.parse('2026-01-01T00:00:00Z');
    const oldDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open('noduct_workspace_db', 2);
      request.onupgradeneeded = () => {
        const documents = request.result.createObjectStore('documents', { keyPath: 'id' });
        documents.createIndex('createdAt', 'createdAt');
        documents.createIndex('updatedAt', 'updatedAt');
        documents.createIndex('name', 'name');
        const state = request.result.createObjectStore('workspace_state', { keyPath: 'key' });
        state.createIndex('updatedAt', 'updatedAt');
        const transfers = request.result.createObjectStore('transfers', { keyPath: 'transferId' });
        transfers.createIndex('documentId', 'documentId');
        transfers.createIndex('expiresAt', 'expiresAt');
        transfers.createIndex('consumedAt', 'consumedAt');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = oldDb.transaction('documents', 'readwrite');
      tx.objectStore('documents').put({
        id: 'legacy-id',
        name: 'legacy.pdf',
        size: 3,
        mimeType: 'application/pdf',
        createdAt: oldTimestamp - 1000,
        updatedAt: oldTimestamp,
        blob: new Blob(['pdf'])
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    oldDb.close();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(oldTimestamp);
    vi.stubGlobal('navigator', {});
    const client = await openWorkspace({ factory });
    try {
      const doc = (await client.listDocuments())[0];
      expect(CURRENT_SCHEMA_VERSION).toBe(3);
      expect(doc?.retention).toBe('ephemeral');
      expect(doc?.lastAccessedAt).toBe(oldTimestamp);
      expect(await doc?.blob.text()).toBe('pdf');
    } finally {
      client.close();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});
