import type { WorkspaceEnvironment, WorkspaceLoaders, WorkspaceServices } from './contracts';
import { createThumbnailService } from './thumbnails';

const THUMBNAIL_TIMEOUT_MS = 20_000;

/**
 * Compõe cliente e renderer a partir de `import()` dinâmicos da página, para que nenhuma
 * dependência pesada entre na carga inicial:
 *
 *   createWorkspaceServices({
 *     loadWorkspace: () => import('@noduct/workspace-core'),
 *     loadRenderer: () => import('@noduct/pdf-core/render')
 *   })
 */
export function createWorkspaceServices(loaders: WorkspaceLoaders): WorkspaceServices {
  let environment: Promise<WorkspaceEnvironment> | undefined;
  let disposed = false;

  const open = (): Promise<WorkspaceEnvironment> =>
    (environment ??= loaders
      .loadWorkspace()
      .then(async (module) => {
        const client = await module.openWorkspace();
        const budget =
          module.detectDeviceProfile() === 'mobile'
            ? module.MOBILE_RESOURCE_BUDGET
            : module.DESKTOP_RESOURCE_BUDGET;
        return {
          client,
          maxIdleMs: module.DEFAULT_DOCUMENT_MAX_IDLE_MS,
          limitBytes: budget.maxWorkspaceStorageBytes
        };
      })
      .catch((error: unknown) => {
        environment = undefined;
        throw error;
      }));

  const thumbnails = createThumbnailService({
    async render(source) {
      if (!loaders.loadRenderer) return undefined;
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      // Uma prévia que não termina não pode segurar o Web Lock do documento nem a fila.
      const timeout = new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(undefined);
        }, THUMBNAIL_TIMEOUT_MS);
      });
      try {
        const rendering = loaders
          .loadRenderer()
          .then((module) => module.renderPdfThumbnail(source, { signal: controller.signal }));
        return await Promise.race([rendering, timeout]);
      } catch {
        return undefined;
      } finally {
        clearTimeout(timer);
      }
    },
    client: () => open().then(
      ({ client }) => client,
      () => undefined
    )
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    void environment?.then(({ client }) => client.close()).catch(() => undefined);
  };
  if (typeof window !== 'undefined') window.addEventListener('pagehide', dispose, { once: true });

  const hasStoredWorkspace = async () => {
    if (environment) return true;
    try {
      const factory = typeof indexedDB === 'undefined' ? undefined : indexedDB;
      if (!factory?.databases) return true;
      const [{ WORKSPACE_DB_NAME }, databases] = await Promise.all([
        loaders.loadWorkspace(),
        factory.databases()
      ]);
      return databases.some((database) => database.name === WORKSPACE_DB_NAME);
    } catch {
      return true;
    }
  };

  return { environment: open, hasStoredWorkspace, thumbnails, dispose };
}
