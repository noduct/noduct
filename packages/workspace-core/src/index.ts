import { WorkspaceNotifier } from './broadcast';
import {
  dbClearDocuments,
  dbDeleteDocument,
  dbGetDocument,
  dbGetState,
  dbListDocuments,
  dbPutDocument,
  dbSetState,
  openDatabase
} from './db';
import type {
  NewWorkspaceDocument,
  WorkspaceChangeListener,
  WorkspaceDocument
} from './types';

export * from './types';
export { WORKSPACE_CHANNEL_NAME } from './broadcast';
export {
  CURRENT_SCHEMA_VERSION,
  DOCUMENTS_STORE,
  STATE_STORE,
  WORKSPACE_DB_NAME
} from './db';

export class WorkspaceClient {
  private notifier = new WorkspaceNotifier();

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
    return dbGetDocument(this.db, id);
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

  subscribe(listener: WorkspaceChangeListener): () => void {
    return this.notifier.subscribe(listener);
  }

  close(): void {
    this.notifier.close();
    this.db.close();
  }
}

export async function openWorkspace(options?: {
  factory?: IDBFactory | undefined;
}): Promise<WorkspaceClient> {
  const db = await openDatabase(options?.factory);
  return new WorkspaceClient(db);
}

