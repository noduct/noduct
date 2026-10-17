export const WORKSPACE_OPEN_EVENT = 'noduct:workspace-open';
export const WORKSPACE_CLOSE_EVENT = 'noduct:workspace-close';
export const WORKSPACE_ACTION_EVENT = 'noduct:workspace-action';

export type WorkspaceActionDetail =
  | { readonly action: 'clear-all' }
  | { readonly action: 'download' | 'delete'; readonly documentId: string }
  | {
      readonly action: 'set-retention';
      readonly documentId: string;
      readonly retention: 'ephemeral' | 'persistent';
    };
