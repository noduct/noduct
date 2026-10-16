import { topology as defaultTopology, type Locale, type Topology } from '@noduct/tool-runtime';
import {
  dbConsumeTransfer,
  dbGetDocument,
  dbGetTransfer,
  dbPutTransfer
} from './db';
import {
  DocumentNotFoundError,
  InvalidToolTargetError,
  TransferAlreadyConsumedError,
  TransferExpiredError,
  TransferNotFoundError,
  type WorkspaceDocument,
  type WorkspaceTransferRecord
} from './types';

export const DEFAULT_TRANSFER_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface CreateTransferOptions {
  readonly ttlMs?: number | undefined;
  readonly sourceTool?: string | undefined;
  /** Locale da ferramenta de destino; preserva o idioma do usuário na navegação. */
  readonly locale?: Locale | undefined;
  /** Topologia injetável (testes); o padrão é a de produção (ADR 0005). */
  readonly topology?: Topology | undefined;
}

export interface CreateTransferResult {
  readonly transferId: string;
  readonly transferUrl: string;
  readonly expiresAt: number;
}

export async function createTransferTicket(
  db: IDBDatabase,
  documentId: string,
  targetTool: string,
  options?: CreateTransferOptions
): Promise<CreateTransferResult> {
  const doc = await dbGetDocument(db, documentId);
  if (!doc) {
    throw new DocumentNotFoundError(documentId);
  }

  if (!targetTool || typeof targetTool !== 'string') {
    throw new InvalidToolTargetError('Target tool identifier must be a non-empty string.');
  }

  const topology = options?.topology ?? defaultTopology;
  let targetUrl: string;
  try {
    targetUrl = topology.toolUrl(targetTool, '', options?.locale);
  } catch (cause) {
    throw new InvalidToolTargetError(`Target tool "${targetTool}" is not a valid tool slug.`, cause);
  }

  const transferId = crypto.randomUUID();
  const now = Date.now();
  const ttl = options?.ttlMs ?? DEFAULT_TRANSFER_TTL_MS;
  const expiresAt = now + ttl;

  const record: WorkspaceTransferRecord = {
    transferId,
    documentId,
    sourceTool: options?.sourceTool ?? 'unknown',
    targetTool,
    createdAt: now,
    expiresAt
  };

  await dbPutTransfer(db, record);

  // URL da ferramenta de destino vem da topologia: /<slug>/ ou /<slug>/<locale>/, só com o ticket opaco.
  const url = new URL(targetUrl);
  url.searchParams.set('transferId', transferId);

  return {
    transferId,
    transferUrl: url.toString(),
    expiresAt
  };
}

export async function resolveTransferTicket(
  db: IDBDatabase,
  transferId: string,
  currentTool?: string
): Promise<WorkspaceDocument> {
  const transfer = await dbGetTransfer(db, transferId);
  if (!transfer) {
    throw new TransferNotFoundError(transferId);
  }

  if (transfer.consumedAt) {
    throw new TransferAlreadyConsumedError(transferId);
  }

  const now = Date.now();
  if (transfer.expiresAt <= now) {
    throw new TransferExpiredError(transferId);
  }

  if (currentTool && transfer.targetTool) {
    const cleanCurrent = currentTool.replace(/^\/|\/$/g, '');
    const cleanTarget = transfer.targetTool.replace(/^\/|\/$/g, '');
    if (cleanCurrent !== cleanTarget) {
      throw new InvalidToolTargetError(
        `Transfer was intended for "${transfer.targetTool}", but accessed from "${currentTool}".`
      );
    }
  }

  const doc = await dbGetDocument(db, transfer.documentId);
  if (!doc) {
    throw new DocumentNotFoundError(transfer.documentId);
  }

  // Mark as consumed
  await dbConsumeTransfer(db, transferId);

  return doc;
}

export async function consumeTransferFromUrl(
  db: IDBDatabase,
  currentTool?: string
): Promise<WorkspaceDocument | undefined> {
  if (typeof window === 'undefined' || !window.location) {
    return undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const transferId = params.get('transferId');
  if (!transferId) return undefined;

  const doc = await resolveTransferTicket(db, transferId, currentTool);

  // Clean URL without reloading page
  params.delete('transferId');
  const cleanSearch = params.toString();
  const newUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', newUrl);

  return doc;
}

