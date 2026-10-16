export const WORKSPACE_OPEN_EVENT = 'noduct:workspace-open';
export const WORKSPACE_CLOSE_EVENT = 'noduct:workspace-close';
export const WORKSPACE_ACTION_EVENT = 'noduct:workspace-action';

export interface WorkspaceActionDetail {
  readonly action: 'download' | 'delete' | 'clear-all';
  readonly documentId?: string | undefined;
}

