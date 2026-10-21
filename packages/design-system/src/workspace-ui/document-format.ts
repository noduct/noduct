import type { Locale } from '@noduct/tool-runtime';
import { acceptsFile } from '../file-workflow/contracts';
import type { WorkspaceSummaryLike } from './contracts';
import { workspaceUiMessages } from './messages';

const HOUR_MS = 60 * 60 * 1000;

export type WorkspaceFileKind = 'pdf' | 'file' | 'image' | 'table' | 'code';

/** A extensão conhecida prevalece quando o navegador fornece um MIME genérico ou incorreto. */
export function workspaceFileKind(
  document: Pick<WorkspaceSummaryLike, 'name' | 'mimeType'>
): WorkspaceFileKind {
  const name = document.name.toLowerCase();
  const mime = document.mimeType.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/.test(name)) return 'image';
  if (/\.(csv|tsv|xlsx?|ods)$/.test(name)) return 'table';
  if (/\.(json|xml|html?|css|jsx?|tsx?)$/.test(name)) return 'code';
  if (/\.pdf$/.test(name) || mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'text/csv' || mime.includes('spreadsheet') || mime.includes('excel')) return 'table';
  if (mime === 'application/json' || mime === 'application/xml' || mime.startsWith('text/html'))
    return 'code';
  return 'file';
}

/** Texto de retenção de um documento no instante `now`. */
export function describeRetention(
  document: Pick<WorkspaceSummaryLike, 'retention' | 'lastAccessedAt'>,
  locale: Locale,
  maxIdleMs: number,
  now = Date.now(),
  locksAvailable = typeof navigator !== 'undefined' && Boolean(navigator.locks)
): string {
  const messages = workspaceUiMessages[locale];
  if (document.retention === 'persistent') return messages.persistent;
  const remaining = maxIdleMs - (now - document.lastAccessedAt);
  if (remaining <= 0) return locksAvailable ? messages.expiryPending : messages.expiryUnavailable;
  if (remaining < HOUR_MS) return messages.expiresSoon;
  return messages.expiresInHours(Math.ceil(remaining / HOUR_MS));
}

export function describeSaved(document: Pick<WorkspaceSummaryLike, 'updatedAt'>, locale: Locale) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(document.updatedAt);
  return workspaceUiMessages[locale].savedOn(date);
}

/** Busca sem distinção de caixa nem de acentos. */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();
}

export function matchesSearch(document: Pick<WorkspaceSummaryLike, 'name'>, query: string) {
  const needle = normalizeForSearch(query.trim());
  return !needle || normalizeForSearch(document.name).includes(needle);
}

/** Mesmo critério do atributo `accept` da DropZone, aplicado a documentos salvos. */
export function isCompatible(
  document: Pick<WorkspaceSummaryLike, 'name' | 'mimeType'>,
  accept: string
): boolean {
  return acceptsFile({ name: document.name, type: document.mimeType }, accept);
}

export type WorkspaceSort = 'recent' | 'name' | 'size';

export function sortDocuments<T extends WorkspaceSummaryLike>(
  documents: readonly T[],
  sort: WorkspaceSort,
  locale: Locale
): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  return [...documents].sort((a, b) => {
    if (sort === 'name') return collator.compare(a.name, b.name);
    if (sort === 'size') return b.size - a.size || collator.compare(a.name, b.name);
    return b.updatedAt - a.updatedAt || collator.compare(a.name, b.name);
  });
}
