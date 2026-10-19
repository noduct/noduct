export interface WorkspaceDocument {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
  readonly pageCount?: number | undefined;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly lastAccessedAt: number;
  readonly retention: WorkspaceRetention;
  readonly sourceTool?: string | undefined;
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
  readonly retention?: WorkspaceRetention | undefined;
  readonly sourceTool?: string | undefined;
}

export type WorkspaceRetention = 'ephemeral' | 'persistent';

export interface WorkspaceStateRecord {
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: number;
}

export type WorkspaceChangeType =
  'document_added' | 'document_updated' | 'document_deleted' | 'workspace_cleared';

export interface WorkspaceChangeEvent {
  readonly type: WorkspaceChangeType;
  readonly documentId?: string | undefined;
  readonly reason?: 'expired' | undefined;
  readonly timestamp: number;
}

export type WorkspaceChangeListener = (event: WorkspaceChangeEvent) => void;

export type WorkspaceErrorCode =
  | 'WORKSPACE_UNAVAILABLE'
  | 'DOCUMENT_NOT_FOUND'
  | 'TRANSFER_NOT_FOUND'
  | 'TRANSFER_EXPIRED'
  | 'TRANSFER_ALREADY_CONSUMED'
  | 'INVALID_TOOL_TARGET'
  | 'DB_OPEN_ERROR'
  | 'SCHEMA_VERSION_UNSUPPORTED'
  | 'DB_UPGRADE_BLOCKED'
  | 'REQUEST_ERROR'
  | 'TRANSACTION_ABORTED'
  | 'TRANSACTION_ERROR';

export class WorkspaceError extends Error {
  constructor(
    message: string,
    readonly code: WorkspaceErrorCode,
    override readonly cause?: unknown,
    readonly params: Readonly<Record<string, string | number>> = {}
  ) {
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
    super(
      `Document with ID "${id}" was not found in the local workspace.`,
      'DOCUMENT_NOT_FOUND',
      undefined,
      { id }
    );
    this.name = 'DocumentNotFoundError';
  }
}

export interface WorkspaceTransferRecord {
  readonly transferId: string;
  readonly documentId: string;
  readonly sourceTool: string;
  readonly targetTool: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly consumedAt?: number | undefined;
}

export class TransferNotFoundError extends WorkspaceError {
  constructor(transferId: string) {
    super(
      `Transfer ticket "${transferId}" was not found or does not exist.`,
      'TRANSFER_NOT_FOUND',
      undefined,
      { transferId }
    );
    this.name = 'TransferNotFoundError';
  }
}

export class TransferExpiredError extends WorkspaceError {
  constructor(transferId: string) {
    super(`Transfer ticket "${transferId}" has expired.`, 'TRANSFER_EXPIRED', undefined, {
      transferId
    });
    this.name = 'TransferExpiredError';
  }
}

export class TransferAlreadyConsumedError extends WorkspaceError {
  constructor(transferId: string) {
    super(
      `Transfer ticket "${transferId}" has already been consumed.`,
      'TRANSFER_ALREADY_CONSUMED',
      undefined,
      { transferId }
    );
    this.name = 'TransferAlreadyConsumedError';
  }
}

export class InvalidToolTargetError extends WorkspaceError {
  constructor(
    message: string,
    cause?: unknown,
    params: Readonly<Record<string, string | number>> = {}
  ) {
    super(message, 'INVALID_TOOL_TARGET', cause, params);
    this.name = 'InvalidToolTargetError';
  }
}
