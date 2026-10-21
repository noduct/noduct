import {
  connectLocalWorkspace,
  createWorkspaceServices
} from '@noduct/design-system/workspace-ui';

/**
 * Única porta do hub para o workspace (ADR 0006 D6): tudo chega por `import()` dinâmico, então
 * a home não baixa IndexedDB nem PDF.js até haver algo a mostrar.
 */
export function connectHubWorkspace(): void {
  connectLocalWorkspace(
    document,
    createWorkspaceServices({
      loadWorkspace: () => import('@noduct/workspace-core'),
      loadRenderer: () => import('@noduct/pdf-core/render')
    })
  );
}
