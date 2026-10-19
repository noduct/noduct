import {
  WORKSPACE_ACTION_EVENT,
  WORKSPACE_OPEN_EVENT,
  type WorkspaceActionDetail
} from './contracts';
import {
  getWorkspaceDrawer,
  type WorkspaceDisplayItem,
  type WorkspaceDrawerController
} from './workspace-drawer-runtime';

/** Janela que agrega eventos de outras abas (ex.: uma limpeza remota) em uma só sincronização. */
export const WORKSPACE_SYNC_DEBOUNCE_MS = 100;

interface DocumentSession {
  readonly document: { readonly name: string; readonly blob: Blob };
  release(): void;
}
interface WorkspaceClient {
  readonly initialCleanupRemovedIds: readonly string[];
  cleanupExpiredDocuments(): Promise<readonly string[]>;
  listDocumentSummaries(): Promise<readonly WorkspaceDisplayItem[]>;
  clearDocuments(): Promise<void>;
  deleteDocument(id: string): Promise<boolean>;
  setRetention(id: string, retention: 'ephemeral' | 'persistent'): Promise<unknown>;
  acquireDocument(id: string): Promise<DocumentSession>;
  subscribe(listener: (event: { type: string; reason?: string | undefined }) => void): () => void;
}

export interface WorkspaceDrawerConnectionOptions {
  readonly limitBytes: () => number;
  readonly maxIdleMs: number;
  readonly formatError: (error: unknown) => string;
  readonly debounceMs?: number | undefined;
}

export function connectWorkspaceDrawer(
  root: HTMLElement,
  getClient: () => Promise<WorkspaceClient>,
  options: WorkspaceDrawerConnectionOptions
): () => void {
  const drawer = getWorkspaceDrawer(root);
  if (!drawer) return () => {};
  return bindWorkspaceDrawer(drawer, root, getClient, options);
}

/** Liga um controller já armado aos eventos do drawer; separado para teste sem DOM. */
export function bindWorkspaceDrawer(
  drawer: Pick<WorkspaceDrawerController, 'isOpen' | 'setItems' | 'announceExpired' | 'announceError'>,
  events: EventTarget,
  getClient: () => Promise<WorkspaceClient>,
  options: WorkspaceDrawerConnectionOptions
): () => void {
  const debounceMs = options.debounceMs ?? WORKSPACE_SYNC_DEBOUNCE_MS;
  let unsubscribe: (() => void) | undefined;
  let initialized = false;
  let pendingExpired = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let syncing = false;
  let resyncRequested = false;
  let disposed = false;

  // Debounce de cauda: cada evento adia a sincronização até a rajada terminar.
  function schedule(): void {
    if (disposed) return;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void sync();
    }, debounceMs);
  }

  async function sync(): Promise<void> {
    if (disposed) return;
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
            // Expirações durante a sync vêm da própria limpeza, que a listagem já reflete.
            if (event.reason !== 'expired') resyncRequested = true;
            return;
          }
          if (drawer.isOpen()) schedule();
        });
        initialized = true;
      }
      await client.cleanupExpiredDocuments();
      const documents = await client.listDocumentSummaries();
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
        schedule();
      }
    }
  }

  function onOpen() {
    void sync();
  }
  async function onAction(event: Event) {
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

  events.addEventListener(WORKSPACE_OPEN_EVENT, onOpen);
  events.addEventListener(WORKSPACE_ACTION_EVENT, onAction);
  return () => {
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    unsubscribe?.();
    events.removeEventListener(WORKSPACE_OPEN_EVENT, onOpen);
    events.removeEventListener(WORKSPACE_ACTION_EVENT, onAction);
  };
}
