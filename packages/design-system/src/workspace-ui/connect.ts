import {
  WORKSPACE_ACTION_EVENT,
  WORKSPACE_OPEN_EVENT,
  type WorkspaceActionDetail
} from './contracts';
import { getWorkspaceDrawer, type WorkspaceDisplayItem } from './workspace-drawer-runtime';

interface WorkspaceDocument extends WorkspaceDisplayItem {
  readonly blob: Blob;
}
interface DocumentSession {
  readonly document: WorkspaceDocument;
  release(): void;
}
interface WorkspaceClient {
  readonly initialCleanupRemovedIds: readonly string[];
  cleanupExpiredDocuments(): Promise<readonly string[]>;
  listDocuments(): Promise<readonly WorkspaceDocument[]>;
  clearDocuments(): Promise<void>;
  deleteDocument(id: string): Promise<boolean>;
  setRetention(id: string, retention: 'ephemeral' | 'persistent'): Promise<WorkspaceDocument>;
  acquireDocument(id: string): Promise<DocumentSession>;
  subscribe(listener: (event: { type: string; reason?: string | undefined }) => void): () => void;
}

export function connectWorkspaceDrawer(
  root: HTMLElement,
  getClient: () => Promise<WorkspaceClient>,
  options: { limitBytes: () => number; maxIdleMs: number; formatError: (error: unknown) => string }
): () => void {
  const drawer = getWorkspaceDrawer(root);
  let unsubscribe: (() => void) | undefined;
  let initialized = false;
  let pendingExpired = 0;
  let scheduled = false;
  let syncing = false;
  let resyncRequested = false;
  let disposed = false;

  async function sync(): Promise<void> {
    if (disposed || !drawer) return;
    if (syncing) {
      resyncRequested = true;
      return;
    }
    syncing = true;
    try {
      const client = await getClient();
      if (!initialized) {
        pendingExpired += client.initialCleanupRemovedIds.length;
        unsubscribe = client.subscribe((event) => {
          if (event.type === 'document_deleted' && event.reason === 'expired') pendingExpired++;
          if (syncing) {
            if (event.reason !== 'expired') resyncRequested = true;
            return;
          }
          if (drawer.isOpen() && !scheduled) {
            scheduled = true;
            queueMicrotask(() => {
              scheduled = false;
              void sync();
            });
          }
        });
        initialized = true;
      }
      await client.cleanupExpiredDocuments();
      const documents = await client.listDocuments();
      const totalBytes = documents.reduce((total, document) => total + document.size, 0);
      drawer.setItems(documents, totalBytes, options.limitBytes(), options.maxIdleMs);
      drawer.announceExpired(pendingExpired);
      pendingExpired = 0;
    } catch (error) {
      drawer.announceError(options.formatError(error));
    } finally {
      syncing = false;
      if (resyncRequested && drawer.isOpen()) {
        resyncRequested = false;
        if (!scheduled) {
          scheduled = true;
          queueMicrotask(() => {
            scheduled = false;
            void sync();
          });
        }
      }
    }
  }

  function onOpen() {
    void sync();
  }
  async function onAction(event: Event) {
    if (!drawer) return;
    const detail = (event as CustomEvent<WorkspaceActionDetail>).detail;
    try {
      const client = await getClient();
      switch (detail.action) {
        case 'clear-all':
          await client.clearDocuments();
          break;
        case 'delete':
          await client.deleteDocument(detail.documentId);
          break;
        case 'set-retention':
          await client.setRetention(detail.documentId, detail.retention);
          break;
        case 'download': {
          const session = await client.acquireDocument(detail.documentId);
          try {
            const url = URL.createObjectURL(session.document.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = session.document.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          } finally {
            session.release();
          }
          break;
        }
      }
      await sync();
    } catch (error) {
      drawer.announceError(options.formatError(error));
    }
  }

  root.addEventListener(WORKSPACE_OPEN_EVENT, onOpen);
  root.addEventListener(WORKSPACE_ACTION_EVENT, onAction);
  return () => {
    disposed = true;
    unsubscribe?.();
    root.removeEventListener(WORKSPACE_OPEN_EVENT, onOpen);
    root.removeEventListener(WORKSPACE_ACTION_EVENT, onAction);
  };
}
