import type { WorkspaceEnvironment, WorkspaceServices } from './contracts';

/** Janela que agrega eventos de outras abas (ex.: uma limpeza remota) em uma só sincronização. */
export const WORKSPACE_SYNC_DEBOUNCE_MS = 100;

export interface WorkspaceSyncOptions {
  readonly services: Pick<WorkspaceServices, 'environment' | 'thumbnails'>;
  /** Lista e desenha a superfície; roda depois da limpeza de expirados. */
  readonly render: (environment: WorkspaceEnvironment) => Promise<void>;
  /** Chamado uma vez por ciclo com a contagem acumulada de expirações (pode ser 0). */
  readonly onExpired?: ((count: number) => void) | undefined;
  readonly onError: (error: unknown) => void;
  /** Só sincroniza sozinho enquanto a superfície estiver visível ou aberta. */
  readonly isActive: () => boolean;
  /** Conta as expirações da abertura do workspace (apenas a superfície que as anuncia). */
  readonly includeInitialCleanup?: boolean | undefined;
  readonly debounceMs?: number | undefined;
}

export interface WorkspaceSync {
  sync(): Promise<void>;
  dispose(): void;
}

export function createWorkspaceSync(options: WorkspaceSyncOptions): WorkspaceSync {
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
      const environment = await options.services.environment();
      if (!initialized) {
        if (options.includeInitialCleanup)
          pendingExpired += environment.client.initialCleanupRemovedIds.length;
        unsubscribe = environment.client.subscribe((event) => {
          if (event.type === 'document_deleted' && event.reason === 'expired') pendingExpired++;
          // Ler um documento (inclusive para gerar a miniatura) só renova o prazo, e uma miniatura
          // nova não muda a lista: redesenhar nesses casos criava um ciclo que fazia a lista piscar.
          if (event.reason === 'accessed' || event.type === 'thumbnail_updated') return;
          options.services.thumbnails.invalidate();
          if (syncing) {
            // Expirações durante a sync vêm da própria limpeza, que a listagem já reflete.
            if (event.reason !== 'expired') resyncRequested = true;
            return;
          }
          if (options.isActive()) schedule();
        });
        initialized = true;
      }
      await environment.client.cleanupExpiredDocuments();
      await options.render(environment);
      options.onExpired?.(pendingExpired);
      pendingExpired = 0;
    } catch (error) {
      options.onError(error);
    } finally {
      syncing = false;
      if (resyncRequested && options.isActive()) {
        resyncRequested = false;
        schedule();
      }
    }
  }

  return {
    sync,
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe?.();
    }
  };
}
