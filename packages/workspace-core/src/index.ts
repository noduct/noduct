import { WorkspaceNotifier } from './broadcast';
import {
  dbCleanupExpiredTransfers,
  dbClearDocuments,
  dbClearTransfers,
  dbDeleteDocument,
  dbDeleteDocumentIfExpired,
  dbGetState,
  dbGetTransfer,
  dbListDocuments,
  dbListExpiredDocumentIds,
  dbPutDocument,
  dbSetRetention,
  dbSetState,
  dbTouchDocument,
  openDatabase
} from './db';
import {
  consumeTransferFromUrl,
  createTransferTicket,
  DEFAULT_TRANSFER_TTL_MS,
  resolveTransferTicket,
  type CreateTransferOptions,
  type CreateTransferResult
} from './transfer';
import {
  DocumentNotFoundError,
  type NewWorkspaceDocument,
  type WorkspaceChangeListener,
  type WorkspaceDocument,
  type WorkspaceRetention
} from './types';

export const DEFAULT_DOCUMENT_MAX_IDLE_MS = 24 * 60 * 60 * 1000;

export * from './types';
export * from './resource-budget';
export { WORKSPACE_CHANNEL_NAME } from './broadcast';
export {
  CURRENT_SCHEMA_VERSION,
  DOCUMENTS_STORE,
  STATE_STORE,
  TRANSFERS_STORE,
  WORKSPACE_DB_NAME
} from './db';
export {
  consumeTransferFromUrl,
  createTransferTicket,
  DEFAULT_TRANSFER_TTL_MS,
  resolveTransferTicket,
  type CreateTransferOptions,
  type CreateTransferResult
};

export class WorkspaceClient {
  private notifier = new WorkspaceNotifier();
  private visibilityListener?: () => void;
  private activeSessions = new Set<() => void>();
  initialCleanupRemovedIds: readonly string[] = [];

  constructor(private db: IDBDatabase) {}

  async saveDocument(doc: NewWorkspaceDocument): Promise<WorkspaceDocument> {
    const saved = await dbPutDocument(this.db, doc);
    this.notifier.emit({
      type: doc.id ? 'document_updated' : 'document_added',
      documentId: saved.id,
      timestamp: saved.updatedAt
    });
    return saved;
  }

  async getDocument(id: string): Promise<WorkspaceDocument | undefined> {
    return this.withDocumentLock(id, () => this.touchDocument(id));
  }

  async touchDocument(id: string): Promise<WorkspaceDocument | undefined> {
    const doc = await dbTouchDocument(this.db, id);
    if (doc)
      this.notifier.emit({
        type: 'document_updated',
        documentId: id,
        timestamp: doc.lastAccessedAt
      });
    return doc;
  }

  async setRetention(id: string, retention: WorkspaceRetention): Promise<WorkspaceDocument> {
    const doc = await dbSetRetention(this.db, id, retention);
    if (!doc) throw new DocumentNotFoundError(id);
    this.notifier.emit({ type: 'document_updated', documentId: id, timestamp: doc.lastAccessedAt });
    return doc;
  }

  async withDocumentLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) return operation();
    return locks.request(`noduct-doc-${id}`, { mode: 'shared' }, operation);
  }

  async acquireDocument(id: string): Promise<{ document: WorkspaceDocument; release(): void }> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) {
      const document = await this.touchDocument(id);
      if (!document) throw new DocumentNotFoundError(id);
      return { document, release() {} };
    }
    return new Promise((resolve, reject) => {
      void locks
        .request(`noduct-doc-${id}`, { mode: 'shared' }, async () => {
          let endSession: () => void = () => {};
          const held = new Promise<void>((release) => {
            endSession = release;
          });
          try {
            const document = await this.touchDocument(id);
            if (!document) throw new DocumentNotFoundError(id);
            const release = () => {
              this.activeSessions.delete(release);
              endSession();
            };
            this.activeSessions.add(release);
            resolve({ document, release });
            await held;
          } catch (error) {
            reject(error);
          }
        })
        .catch(reject);
    });
  }

  async cleanupExpiredDocuments(
    now = Date.now(),
    maxIdleMs = DEFAULT_DOCUMENT_MAX_IDLE_MS
  ): Promise<string[]> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    // Without cross-tab locks, automatic deletion cannot prove another tab is idle.
    if (!locks) return [];
    const cutoff = now - maxIdleMs;
    const candidates = await dbListExpiredDocumentIds(this.db, cutoff);
    const deleted: string[] = [];
    for (const id of candidates) {
      await locks.request(
        `noduct-doc-${id}`,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => {
          if (!lock) return;
          if (await dbDeleteDocumentIfExpired(this.db, id, cutoff)) {
            deleted.push(id);
            this.notifier.emit({
              type: 'document_deleted',
              documentId: id,
              reason: 'expired',
              timestamp: now
            });
          }
        }
      );
    }
    return deleted;
  }

  async listDocuments(): Promise<readonly WorkspaceDocument[]> {
    return dbListDocuments(this.db);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const deleted = await dbDeleteDocument(this.db, id);
    if (deleted) {
      this.notifier.emit({
        type: 'document_deleted',
        documentId: id,
        timestamp: Date.now()
      });
    }
    return deleted;
  }

  async clearDocuments(): Promise<void> {
    await dbClearDocuments(this.db);
    this.notifier.emit({
      type: 'workspace_cleared',
      timestamp: Date.now()
    });
  }

  async getWorkspaceSize(): Promise<{ documentCount: number; totalBytes: number }> {
    const docs = await this.listDocuments();
    const totalBytes = docs.reduce((acc, d) => acc + (d.size || 0), 0);
    return {
      documentCount: docs.length,
      totalBytes
    };
  }

  async getState(key: string): Promise<unknown | undefined> {
    return dbGetState(this.db, key);
  }

  async setState(key: string, value: unknown): Promise<void> {
    return dbSetState(this.db, key, value);
  }

  async createTransfer(
    documentId: string,
    targetTool: string,
    options?: CreateTransferOptions
  ): Promise<CreateTransferResult> {
    return this.withDocumentLock(documentId, () =>
      createTransferTicket(this.db, documentId, targetTool, options)
    );
  }

  async resolveTransfer(transferId: string, currentTool?: string): Promise<WorkspaceDocument> {
    const ticket = await dbGetTransfer(this.db, transferId);
    if (!ticket) return resolveTransferTicket(this.db, transferId, currentTool);
    return this.withDocumentLock(ticket.documentId, () =>
      resolveTransferTicket(this.db, transferId, currentTool)
    );
  }

  async consumeFromUrl(currentTool?: string): Promise<WorkspaceDocument | undefined> {
    const transferId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('transferId')
        : null;
    if (!transferId) return undefined;
    const ticket = await dbGetTransfer(this.db, transferId);
    const document = !ticket
      ? await consumeTransferFromUrl(this.db, currentTool)
      : await this.withDocumentLock(ticket.documentId, () =>
          consumeTransferFromUrl(this.db, currentTool)
        );
    if (document)
      this.notifier.emit({
        type: 'document_updated',
        documentId: document.id,
        timestamp: document.lastAccessedAt
      });
    return document;
  }

  async cleanupExpiredTransfers(now = Date.now()): Promise<number> {
    return dbCleanupExpiredTransfers(this.db, now);
  }

  async clearTransfers(): Promise<void> {
    return dbClearTransfers(this.db);
  }

  subscribe(listener: WorkspaceChangeListener): () => void {
    return this.notifier.subscribe(listener);
  }

  close(): void {
    for (const release of this.activeSessions) release();
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    this.notifier.close();
    this.db.close();
  }

  armVisibilityCleanup(): void {
    if (typeof document === 'undefined' || this.visibilityListener) return;
    this.visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        void Promise.all([this.cleanupExpiredDocuments(), this.cleanupExpiredTransfers()]).catch(
          () => {
            // A restricted browser may revoke storage access while the tab is hidden.
          }
        );
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }
}

export async function openWorkspace(options?: {
  factory?: IDBFactory | undefined;
}): Promise<WorkspaceClient> {
  const db = await openDatabase(options?.factory);
  const client = new WorkspaceClient(db);
  try {
    const [removed] = await Promise.all([
      client.cleanupExpiredDocuments(),
      client.cleanupExpiredTransfers()
    ]);
    client.initialCleanupRemovedIds = removed;
    client.armVisibilityCleanup();
    return client;
  } catch (error) {
    client.close();
    throw error;
  }
}
