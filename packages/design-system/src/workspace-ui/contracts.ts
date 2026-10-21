/**
 * Formas estruturais do `@noduct/workspace-core` e do renderer do `@noduct/pdf-core/render`.
 * O design system não depende desses pacotes (ADR 0003); a página injeta os módulos reais.
 */
export type WorkspaceRetentionLike = 'ephemeral' | 'persistent';

export interface WorkspaceSummaryLike {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly lastAccessedAt: number;
  readonly retention: WorkspaceRetentionLike;
  readonly sourceTool?: string | undefined;
}

export interface WorkspaceThumbnailLike {
  readonly id: string;
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
}

export interface WorkspaceChangeLike {
  readonly type: string;
  readonly documentId?: string | undefined;
  readonly reason?: string | undefined;
}

export interface WorkspaceClientLike {
  readonly initialCleanupRemovedIds: readonly string[];
  cleanupExpiredDocuments(): Promise<readonly string[]>;
  listDocumentSummaries(): Promise<readonly WorkspaceSummaryLike[]>;
  listThumbnails(): Promise<readonly WorkspaceThumbnailLike[]>;
  saveThumbnail(thumbnail: WorkspaceThumbnailLike): Promise<boolean>;
  saveDocument(document: {
    readonly name: string;
    readonly blob: Blob;
    readonly size?: number | undefined;
    readonly mimeType?: string | undefined;
    readonly retention?: WorkspaceRetentionLike | undefined;
    readonly sourceTool?: string | undefined;
  }): Promise<WorkspaceSummaryLike>;
  deleteDocument(id: string): Promise<boolean>;
  clearDocuments(): Promise<void>;
  setRetention(id: string, retention: WorkspaceRetentionLike): Promise<unknown>;
  renameDocument(id: string, name: string): Promise<WorkspaceSummaryLike>;
  acquireDocument(id: string): Promise<{
    readonly document: WorkspaceSummaryLike & { readonly blob: Blob };
    release(): void;
  }>;
  subscribe(listener: (event: WorkspaceChangeLike) => void): () => void;
  close(): void;
}

interface StorageBudgetLike {
  readonly maxWorkspaceStorageBytes: number;
}

export interface WorkspaceModuleLike {
  readonly WORKSPACE_DB_NAME: string;
  openWorkspace(): Promise<WorkspaceClientLike>;
  readonly DEFAULT_DOCUMENT_MAX_IDLE_MS: number;
  readonly DESKTOP_RESOURCE_BUDGET: StorageBudgetLike;
  readonly MOBILE_RESOURCE_BUDGET: StorageBudgetLike;
  detectDeviceProfile(): 'desktop' | 'mobile';
}

export interface RenderedThumbnailLike {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
}

export interface ThumbnailRendererModuleLike {
  renderPdfThumbnail(
    source: Blob,
    options?: { readonly signal?: AbortSignal | undefined }
  ): Promise<RenderedThumbnailLike>;
}

export interface WorkspaceLoaders {
  readonly loadWorkspace: () => Promise<WorkspaceModuleLike>;
  readonly loadRenderer?: (() => Promise<ThumbnailRendererModuleLike>) | undefined;
}

export interface WorkspaceEnvironment {
  readonly client: WorkspaceClientLike;
  readonly maxIdleMs: number;
  readonly limitBytes: number;
}

export interface ThumbnailService {
  /** Prévia de um arquivo em memória (pilha, resultado); não grava nada. */
  forFile(file: Blob): Promise<RenderedThumbnailLike | undefined>;
  /** Prévia de um documento salvo: lê a store ou gera, grava e devolve. */
  forDocument(document: WorkspaceSummaryLike): Promise<Blob | undefined>;
  /** Associa uma prévia já gerada a um documento recém-salvo. */
  remember(id: string, thumbnail: RenderedThumbnailLike): Promise<void>;
  /** Descarta o cache depois de mudanças vindas de outra aba. */
  invalidate(): void;
}

export interface WorkspaceServices {
  environment(): Promise<WorkspaceEnvironment>;
  /**
   * Diz se o banco já existe, sem criá-lo. Superfícies passivas (a home) não devem criar
   * armazenamento só porque a página foi aberta. Sem `indexedDB.databases()`, responde `true`.
   */
  hasStoredWorkspace(): Promise<boolean>;
  readonly thumbnails: ThumbnailService;
  dispose(): void;
}

export const WORKSPACE_FILE_SOURCE = 'workspace';
