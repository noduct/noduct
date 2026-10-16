import type { DesignLocale } from '../i18n';
import { fileWorkflowMessages } from './messages';

export interface FileListItem {
  id: string;
  name: string;
  size: number;
  pageCount?: number | undefined;
}

export interface FilesSelectedDetail {
  accepted: File[];
  rejected: File[];
}

export interface ListChangeDetail {
  action: 'move' | 'remove';
  id: string;
  ids: string[];
}

export const FILES_SELECTED_EVENT = 'noduct:files';
export const LIST_CHANGE_EVENT = 'noduct:list-change';
export const CANCEL_EVENT = 'noduct:cancel';
export const RESTART_EVENT = 'noduct:restart';

export const DEFAULT_PDF_ACCEPT = 'application/pdf,.pdf';

type FileIdentity = Pick<File, 'name' | 'type'>;

/** Mirrors the `accept` attribute: MIME types, `type/*` wildcards and extensions. */
export function acceptsFile(file: FileIdentity, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

const sizeUnits = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

export function formatFileSize(bytes: number, locale: DesignLocale = 'en'): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < sizeUnits.length - 1) {
    value /= 1024;
    unit++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: sizeUnits[unit],
    unitDisplay: 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1
  }).format(value);
}

export function describeFileItem(item: FileListItem, locale: DesignLocale = 'en'): string {
  const size = formatFileSize(item.size, locale);
  return item.pageCount === undefined
    ? size
    : `${size} · ${fileWorkflowMessages[locale].pages(item.pageCount)}`;
}
