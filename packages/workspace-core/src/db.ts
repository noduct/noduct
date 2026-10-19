import {
  type NewWorkspaceDocument,
  type WorkspaceDocument,
  type WorkspaceDocumentSummary,
  type WorkspaceThumbnail,
  type WorkspaceStateRecord,
  type WorkspaceTransferRecord,
  type WorkspaceRetention,
  TransferNotFoundError,
  WorkspaceError,
  WorkspaceUnavailableError
} from './types';

export const WORKSPACE_DB_NAME = 'noduct_workspace_db';
export const CURRENT_SCHEMA_VERSION = 4;
export const DOCUMENTS_STORE = 'documents';
/** Payloads ficam fora de `documents` para que metadados sejam regravados sem copiar o Blob. */
export const DOCUMENT_BLOBS_STORE = 'document_blobs';
/** Miniaturas derivadas (ADR 0006); seguem o ciclo de vida do documento. */
export const DOCUMENT_THUMBNAILS_STORE = 'document_thumbnails';
const DOCUMENT_STORES = [DOCUMENTS_STORE, DOCUMENT_BLOBS_STORE, DOCUMENT_THUMBNAILS_STORE];
export const STATE_STORE = 'workspace_state';
export const TRANSFERS_STORE = 'transfers';

interface DocumentBlobRecord {
  readonly id: string;
  readonly blob: Blob;
}

type LegacyDocumentRecord = Omit<WorkspaceDocumentSummary, 'retention' | 'lastAccessedAt'> &
  Partial<Pick<WorkspaceDocument, 'retention' | 'lastAccessedAt' | 'blob'>>;

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
    let settled = false;
    const timeout = setTimeout(() => fail('DB_UPGRADE_BLOCKED'), 10000);
    function fail(
      code: 'DB_UPGRADE_BLOCKED' | 'SCHEMA_VERSION_UNSUPPORTED' | 'DB_OPEN_ERROR',
      cause?: unknown
    ) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new WorkspaceError(code, code, cause));
    }
    let request: IDBOpenDBRequest;
    try {
      request = idb.open(WORKSPACE_DB_NAME, CURRENT_SCHEMA_VERSION);
    } catch (error) {
      clearTimeout(timeout);
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
      if (!db.objectStoreNames.contains(DOCUMENT_BLOBS_STORE)) {
        db.createObjectStore(DOCUMENT_BLOBS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DOCUMENT_THUMBNAILS_STORE)) {
        db.createObjectStore(DOCUMENT_THUMBNAILS_STORE, { keyPath: 'id' });
      }
      if (event.oldVersion > 0 && event.oldVersion < 4) {
        // Uma passada só: v1/v2 ganham retenção (v3) e todo registro perde o Blob embutido (v4).
        const blobStore = tx.objectStore(DOCUMENT_BLOBS_STORE);
        const cursorRequest = docStore.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const { blob, ...legacy } = cursor.value as LegacyDocumentRecord;
          if (blob) blobStore.put({ id: legacy.id, blob } satisfies DocumentBlobRecord);
          cursor.update({
            ...legacy,
            retention: legacy.retention ?? 'ephemeral',
            lastAccessedAt: legacy.lastAccessedAt ?? legacy.updatedAt
          } satisfies WorkspaceDocumentSummary);
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
      if (settled) {
        db.close();
        return;
      }
      settled = true;
      clearTimeout(timeout);
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () =>
      fail(
        request.error?.name === 'VersionError' ? 'SCHEMA_VERSION_UNSUPPORTED' : 'DB_OPEN_ERROR',
        request.error
      );
    request.onblocked = () => {
      fail('DB_UPGRADE_BLOCKED');
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
  const tx = db.transaction(DOCUMENT_STORES, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const existing = doc.id
    ? ((await requestToPromise(store.get(id))) as WorkspaceDocumentSummary | undefined)
    : undefined;
  // Conteúdo novo invalida a prévia antiga; a próxima superfície a regenera.
  if (existing) await requestToPromise(tx.objectStore(DOCUMENT_THUMBNAILS_STORE).delete(id));
  const summary: WorkspaceDocumentSummary = {
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
    metadata: doc.metadata ?? existing?.metadata
  };
  await requestToPromise(store.put(summary));
  await requestToPromise(
    tx.objectStore(DOCUMENT_BLOBS_STORE).put({ id, blob: doc.blob } satisfies DocumentBlobRecord)
  );
  await transactionToPromise(tx);
  return { ...summary, blob: doc.blob };
}

/** Regrava só os metadados; o Blob é lido na mesma transação apenas para compor o retorno. */
async function updateSummary(
  db: IDBDatabase,
  id: string,
  change: (summary: WorkspaceDocumentSummary) => WorkspaceDocumentSummary
): Promise<WorkspaceDocument | undefined> {
  const tx = db.transaction([DOCUMENTS_STORE, DOCUMENT_BLOBS_STORE], 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const summary = (await requestToPromise(store.get(id))) as WorkspaceDocumentSummary | undefined;
  if (!summary) return undefined;
  const updated = change(summary);
  await requestToPromise(store.put(updated));
  const payload = (await requestToPromise(tx.objectStore(DOCUMENT_BLOBS_STORE).get(id))) as
    DocumentBlobRecord | undefined;
  await transactionToPromise(tx);
  return payload ? { ...updated, blob: payload.blob } : undefined;
}

export async function dbTouchDocument(
  db: IDBDatabase,
  id: string,
  now = Date.now()
): Promise<WorkspaceDocument | undefined> {
  return updateSummary(db, id, (summary) => ({ ...summary, lastAccessedAt: now }));
}

/**
 * Mudar a retenção é uma ação explícita sobre o documento e por isso conta como acesso:
 * sem renovar `lastAccessedAt`, voltar um documento antigo para `ephemeral` o faria expirar
 * imediatamente. `updatedAt` permanece, pois o conteúdo não mudou.
 */
export async function dbSetRetention(
  db: IDBDatabase,
  id: string,
  retention: WorkspaceRetention,
  now = Date.now()
): Promise<WorkspaceDocument | undefined> {
  return updateSummary(db, id, (summary) => ({ ...summary, retention, lastAccessedAt: now }));
}

/** Renomeia apenas o registro de metadados: payload, miniatura e data de salvamento são preservados. */
export async function dbRenameDocument(
  db: IDBDatabase,
  id: string,
  name: string,
  now = Date.now()
): Promise<WorkspaceDocumentSummary | undefined> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const summary = (await requestToPromise(store.get(id))) as WorkspaceDocumentSummary | undefined;
  if (!summary) return undefined;
  const updated = { ...summary, name, lastAccessedAt: now };
  await requestToPromise(store.put(updated));
  await transactionToPromise(tx);
  return updated;
}

export async function dbDeleteDocumentIfExpired(
  db: IDBDatabase,
  id: string,
  cutoff: number
): Promise<boolean> {
  const tx = db.transaction(DOCUMENT_STORES, 'readwrite');
  const store = tx.objectStore(DOCUMENTS_STORE);
  const doc = (await requestToPromise(store.get(id))) as WorkspaceDocumentSummary | undefined;
  if (!doc || doc.retention !== 'ephemeral' || doc.lastAccessedAt >= cutoff) return false;
  await deleteDocumentRecords(tx, id);
  await transactionToPromise(tx);
  return true;
}

async function deleteDocumentRecords(tx: IDBTransaction, id: string): Promise<void> {
  for (const name of DOCUMENT_STORES) await requestToPromise(tx.objectStore(name).delete(id));
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
      const doc = cursor.value as WorkspaceDocumentSummary;
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
  const tx = db.transaction([DOCUMENTS_STORE, DOCUMENT_BLOBS_STORE], 'readonly');
  const [summary, payload] = await Promise.all([
    requestToPromise(tx.objectStore(DOCUMENTS_STORE).get(id)) as Promise<
      WorkspaceDocumentSummary | undefined
    >,
    requestToPromise(tx.objectStore(DOCUMENT_BLOBS_STORE).get(id)) as Promise<
      DocumentBlobRecord | undefined
    >
  ]);
  return summary && payload ? { ...summary, blob: payload.blob } : undefined;
}

export async function dbListDocumentSummaries(
  db: IDBDatabase
): Promise<readonly WorkspaceDocumentSummary[]> {
  const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
  const result = await requestToPromise(tx.objectStore(DOCUMENTS_STORE).getAll());
  return (result as WorkspaceDocumentSummary[]) || [];
}

export async function dbListDocuments(db: IDBDatabase): Promise<readonly WorkspaceDocument[]> {
  const tx = db.transaction([DOCUMENTS_STORE, DOCUMENT_BLOBS_STORE], 'readonly');
  const [summaries, payloads] = await Promise.all([
    requestToPromise(tx.objectStore(DOCUMENTS_STORE).getAll()) as Promise<
      WorkspaceDocumentSummary[]
    >,
    requestToPromise(tx.objectStore(DOCUMENT_BLOBS_STORE).getAll()) as Promise<
      DocumentBlobRecord[]
    >
  ]);
  const blobs = new Map(payloads.map((payload) => [payload.id, payload.blob]));
  return summaries.flatMap((summary) => {
    const blob = blobs.get(summary.id);
    return blob ? [{ ...summary, blob }] : [];
  });
}

export async function dbDeleteDocument(db: IDBDatabase, id: string): Promise<boolean> {
  const tx = db.transaction(DOCUMENT_STORES, 'readwrite');
  if ((await requestToPromise(tx.objectStore(DOCUMENTS_STORE).getKey(id))) === undefined)
    return false;
  await deleteDocumentRecords(tx, id);
  await transactionToPromise(tx);
  return true;
}

export async function dbClearDocuments(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(DOCUMENT_STORES, 'readwrite');
  for (const name of DOCUMENT_STORES) await requestToPromise(tx.objectStore(name).clear());
  await transactionToPromise(tx);
}

/** Grava a prévia só se o documento ainda existir, para não deixar miniatura órfã. */
export async function dbPutThumbnail(
  db: IDBDatabase,
  thumbnail: WorkspaceThumbnail
): Promise<boolean> {
  const tx = db.transaction([DOCUMENTS_STORE, DOCUMENT_THUMBNAILS_STORE], 'readwrite');
  if ((await requestToPromise(tx.objectStore(DOCUMENTS_STORE).getKey(thumbnail.id))) === undefined)
    return false;
  await requestToPromise(tx.objectStore(DOCUMENT_THUMBNAILS_STORE).put(thumbnail));
  await transactionToPromise(tx);
  return true;
}

export async function dbListThumbnails(db: IDBDatabase): Promise<readonly WorkspaceThumbnail[]> {
  const tx = db.transaction(DOCUMENT_THUMBNAILS_STORE, 'readonly');
  const result = await requestToPromise(tx.objectStore(DOCUMENT_THUMBNAILS_STORE).getAll());
  return (result as WorkspaceThumbnail[]) || [];
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
