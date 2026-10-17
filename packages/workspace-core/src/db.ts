import {
  type NewWorkspaceDocument,
  type WorkspaceDocument,
  type WorkspaceStateRecord,
  type WorkspaceTransferRecord,
  type WorkspaceRetention,
  TransferNotFoundError,
  WorkspaceError,
  WorkspaceUnavailableError
} from './types';

export const WORKSPACE_DB_NAME = 'noduct_workspace_db';
export const CURRENT_SCHEMA_VERSION = 3;
export const DOCUMENTS_STORE = 'documents';
export const STATE_STORE = 'workspace_state';
export const TRANSFERS_STORE = 'transfers';

function getFactory(customFactory?: IDBFactory): IDBFactory {
  if (customFactory) return customFactory;
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (typeof window !== 'undefined' && window.indexedDB) return window.indexedDB;
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as unknown as { indexedDB?: IDBFactory }).indexedDB
  ) {
    return (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB;
  }
  throw new WorkspaceUnavailableError();
}

export function openDatabase(factory?: IDBFactory): Promise<IDBDatabase> {
  const idb = getFactory(factory);

  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = idb.open(WORKSPACE_DB_NAME, CURRENT_SCHEMA_VERSION);
    } catch (error) {
      reject(new WorkspaceUnavailableError(undefined, error));
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = request.transaction!;

      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        const docStore = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
        docStore.createIndex('createdAt', 'createdAt', { unique: false });
        docStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        docStore.createIndex('name', 'name', { unique: false });
      }

      const docStore = tx.objectStore(DOCUMENTS_STORE);
      if (!docStore.indexNames.contains('lastAccessedAt')) {
        docStore.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
      }
      if (event.oldVersion > 0 && event.oldVersion < 3) {
        const cursorRequest = docStore.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const document = cursor.value as WorkspaceDocument;
          cursor.update({
            ...document,
            retention: 'ephemeral',
            lastAccessedAt: document.updatedAt
          } satisfies WorkspaceDocument);
          cursor.continue();
        };
      }

      if (!db.objectStoreNames.contains(STATE_STORE)) {
        const stateStore = db.createObjectStore(STATE_STORE, { keyPath: 'key' });
        stateStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(TRANSFERS_STORE)) {
        const transferStore = db.createObjectStore(TRANSFERS_STORE, { keyPath: 'transferId' });
        transferStore.createIndex('documentId', 'documentId', { unique: false });
        transferStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        transferStore.createIndex('consumedAt', 'consumedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () =>
      reject(
        new WorkspaceError('Failed to open workspace database', 'DB_OPEN_ERROR', request.error)
      );
    request.onblocked = () => {
      console.warn('[noduct-workspace] Database open blocked by another active tab.');
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new WorkspaceError('Database request failed', 'REQUEST_ERROR', request.error));
  });
}

function transactionToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(new WorkspaceError('Database transaction aborted', 'TRANSACTION_ABORTED', tx.error));
    tx.onerror = () =>
      reject(new WorkspaceError('Database transaction failed', 'TRANSACTION_ERROR', tx.error));
  });
}

export async function dbPutDocument(
  db: IDBDatabase,
  doc: NewWorkspaceDocument
): Promise<WorkspaceDocument> {
  const now = Date.now();
  const id = doc.id ?? crypto.randomUUID();
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const existing = doc.id
    ? ((await requestToPromise(store.get(id))) as WorkspaceDocument | undefined)
    : undefined;
  const fullDoc: WorkspaceDocument = {
    id,
    name: doc.name,
    size: doc.size ?? doc.blob.size,
    mimeType: doc.mimeType ?? doc.blob.type ?? 'application/pdf',
    pageCount: doc.pageCount,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastAccessedAt: now,
    retention: doc.retention ?? existing?.retention ?? 'ephemeral',
    sourceTool: doc.sourceTool ?? existing?.sourceTool,
    blob: doc.blob,
    metadata: doc.metadata ?? existing?.metadata
  };
  await requestToPromise(store.put(fullDoc));
  await transactionToPromise(tx);
  return fullDoc;
}

export async function dbTouchDocument(
  db: IDBDatabase,
  id: string,
  now = Date.now()
): Promise<WorkspaceDocument | undefined> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const doc = (await requestToPromise(store.get(id))) as WorkspaceDocument | undefined;
  if (!doc) return undefined;
  const touched = { ...doc, lastAccessedAt: now } satisfies WorkspaceDocument;
  await requestToPromise(store.put(touched));
  await transactionToPromise(tx);
  return touched;
}

export async function dbSetRetention(
  db: IDBDatabase,
  id: string,
  retention: WorkspaceRetention
): Promise<WorkspaceDocument | undefined> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const doc = (await requestToPromise(store.get(id))) as WorkspaceDocument | undefined;
  if (!doc) return undefined;
  const now = Date.now();
  const updated = {
    ...doc,
    retention,
    updatedAt: now,
    lastAccessedAt: now
  } satisfies WorkspaceDocument;
  await requestToPromise(store.put(updated));
  await transactionToPromise(tx);
  return updated;
}

export async function dbDeleteDocumentIfExpired(
  db: IDBDatabase,
  id: string,
  cutoff: number
): Promise<boolean> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const doc = (await requestToPromise(store.get(id))) as WorkspaceDocument | undefined;
  if (!doc || doc.retention !== 'ephemeral' || doc.lastAccessedAt >= cutoff) return false;
  await requestToPromise(store.delete(id));
  await transactionToPromise(tx);
  return true;
}

export async function dbListExpiredDocumentIds(db: IDBDatabase, cutoff: number): Promise<string[]> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
  const index = tx.objectStore(DOCUMENTS_STORE).index('lastAccessedAt');
  return new Promise((resolve, reject) => {
    const ids: string[] = [];
    const request = index.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || Number(cursor.key) >= cutoff) {
        resolve(ids);
        return;
      }
      const doc = cursor.value as WorkspaceDocument;
      if (doc.retention === 'ephemeral') ids.push(doc.id);
      cursor.continue();
    };
    request.onerror = () =>
      reject(new WorkspaceError('Database request failed', 'REQUEST_ERROR', request.error));
  });
}

export async function dbGetDocument(
  db: IDBDatabase,
  id: string
): Promise<WorkspaceDocument | undefined> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const result = await requestToPromise(store.get(id));
  return (result as WorkspaceDocument) || undefined;
}

export async function dbListDocuments(db: IDBDatabase): Promise<readonly WorkspaceDocument[]> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const result = await requestToPromise(store.getAll());
  return (result as WorkspaceDocument[]) || [];
}

export async function dbDeleteDocument(db: IDBDatabase, id: string): Promise<boolean> {
  const existing = await dbGetDocument(db, id);
  if (!existing) return false;

  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  await requestToPromise(store.delete(id));
  return true;
}

export async function dbClearDocuments(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  await requestToPromise(store.clear());
}

export async function dbGetState(db: IDBDatabase, key: string): Promise<unknown | undefined> {
  const tx = db.transaction(STATE_STORE, 'readonly');
  const store = tx.objectStore(STATE_STORE);
  const result = (await requestToPromise(store.get(key))) as WorkspaceStateRecord | undefined;
  return result?.value;
}

export async function dbSetState(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  const tx = db.transaction(STATE_STORE, 'readwrite');
  const store = tx.objectStore(STATE_STORE);
  const record: WorkspaceStateRecord = {
    key,
    value,
    updatedAt: Date.now()
  };
  await requestToPromise(store.put(record));
}

export async function dbPutTransfer(
  db: IDBDatabase,
  record: WorkspaceTransferRecord
): Promise<void> {
  const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSFERS_STORE);
  await requestToPromise(store.put(record));
}

export async function dbGetTransfer(
  db: IDBDatabase,
  transferId: string
): Promise<WorkspaceTransferRecord | undefined> {
  const tx = db.transaction(TRANSFERS_STORE, 'readonly');
  const store = tx.objectStore(TRANSFERS_STORE);
  const result = await requestToPromise(store.get(transferId));
  return (result as WorkspaceTransferRecord) || undefined;
}

export async function dbConsumeTransfer(
  db: IDBDatabase,
  transferId: string
): Promise<WorkspaceTransferRecord> {
  const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSFERS_STORE);
  const record = (await requestToPromise(store.get(transferId))) as
    WorkspaceTransferRecord | undefined;
  if (!record) {
    throw new TransferNotFoundError(transferId);
  }
  const updated: WorkspaceTransferRecord = {
    ...record,
    consumedAt: Date.now()
  };
  await requestToPromise(store.put(updated));
  return updated;
}

export async function dbCleanupExpiredTransfers(
  db: IDBDatabase,
  now = Date.now()
): Promise<number> {
  const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSFERS_STORE);
  const all = ((await requestToPromise(store.getAll())) as WorkspaceTransferRecord[]) || [];
  let deletedCount = 0;
  for (const item of all) {
    if (item.expiresAt <= now || item.consumedAt) {
      await requestToPromise(store.delete(item.transferId));
      deletedCount++;
    }
  }
  return deletedCount;
}

export async function dbClearTransfers(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(TRANSFERS_STORE, 'readwrite');
  const store = tx.objectStore(TRANSFERS_STORE);
  await requestToPromise(store.clear());
}
