export interface WorkspaceDocument {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
  readonly pageCount?: number | undefined;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly blob: Blob;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface NewWorkspaceDocument {
  readonly id?: string | undefined;
  readonly name: string;
  readonly size?: number | undefined;
  readonly mimeType?: string | undefined;
  readonly pageCount?: number | undefined;
  readonly blob: Blob;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface WorkspaceStateRecord {
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: number;
}

export type WorkspaceChangeType =
  | 'document_added'
  | 'document_updated'
  | 'document_deleted'
  | 'workspace_cleared';

export interface WorkspaceChangeEvent {
  readonly type: WorkspaceChangeType;
  readonly documentId?: string | undefined;
  readonly timestamp: number;
}

export type WorkspaceChangeListener = (event: WorkspaceChangeEvent) => void;

export class WorkspaceError extends Error {
  constructor(message: string, readonly code: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

export class WorkspaceUnavailableError extends WorkspaceError {
  constructor(message = 'Local workspace storage (IndexedDB) is not available.', cause?: unknown) {
    super(message, 'WORKSPACE_UNAVAILABLE', cause);
    this.name = 'WorkspaceUnavailableError';
  }
}

export class DocumentNotFoundError extends WorkspaceError {
  constructor(id: string) {
    super(`Document with ID "${id}" was not found in the local workspace.`, 'DOCUMENT_NOT_FOUND');
    this.name = 'DocumentNotFoundError';
  }
}

