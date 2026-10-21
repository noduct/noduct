import type { Locale } from '@noduct/tool-runtime';
import { fileWorkflowMessages } from './messages';

export interface FileListItem {
  id: string;
  name: string;
  size: number;
  pageCount?: number | undefined;
}

/** De onde vieram os arquivos; `documentIds` acompanha a origem `workspace` (ADR 0006). */
export type FileOrigin =
  | { readonly source: 'device' }
  | { readonly source: 'workspace'; readonly documentIds: readonly string[] };

export type FilesSelectedDetail = {
  accepted: File[];
  rejected: File[];
} & FileOrigin;

export interface ListChangeDetail {
  action: 'move' | 'remove';
  id: string;
  ids: string[];
}

export const FILES_SELECTED_EVENT = 'noduct:files';
export const LIST_CHANGE_EVENT = 'noduct:list-change';
export const CANCEL_EVENT = 'noduct:cancel';
export const RESTART_EVENT = 'noduct:restart';

/** Formatos canônicos aceitos por domínio de ferramenta no ecossistema Noduct. */
export const FILE_ACCEPT = {
  pdf: 'application/pdf,.pdf',
  image:
    'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/bmp,image/tiff,.png,.jpg,.jpeg,.webp,.gif,.avif,.svg,.bmp,.tif,.tiff',
  text: 'text/plain,text/markdown,.txt,.md,.markdown',
  table:
    'text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.oasis.opendocument.spreadsheet,.csv,.tsv,.xlsx,.xls,.ods',
  code: 'application/json,application/xml,text/xml,text/html,text/css,text/javascript,application/javascript,application/x-yaml,text/yaml,.json,.xml,.html,.htm,.css,.js,.mjs,.cjs,.ts,.tsx,.jsx,.yaml,.yml'
} as const;

export const DEFAULT_PDF_ACCEPT = FILE_ACCEPT.pdf;

/**
 * Na Área de Trabalho Local (`/workspace/`), a seleção de arquivos é livre (`''`);
 * cada ferramenta declara e aplica sua própria restrição `accept` ao consumir arquivos.
 */
export const DEFAULT_WORKSPACE_ACCEPT = '';

const EXTENSION_MIME_MAP: Readonly<Record<string, string>> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.tsv': 'text/tab-separated-values',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'text/javascript',
  '.ts': 'text/plain',
  '.tsx': 'text/plain',
  '.jsx': 'text/plain',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml'
};

type FileIdentity = Pick<File, 'name' | 'type'>;

/**
 * Resolve o MIME type real de um arquivo a partir de `file.type` ou da extensão de `file.name`.
 * Evita rotular arquivos sem `file.type` (ex.: `.md`, `.csv`, `.txt`, `.json`) como `application/pdf`.
 */
export function resolveFileMimeType(file: {
  readonly name: string;
  readonly type?: string | undefined;
}): string {
  const rawType = file.type?.trim().toLowerCase() ?? '';
  if (rawType && rawType !== 'application/octet-stream') return rawType;
  const lowerName = file.name.toLowerCase();
  const dotIndex = lowerName.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = lowerName.slice(dotIndex);
    const mapped = EXTENSION_MIME_MAP[ext];
    if (mapped) return mapped;
  }
  return rawType || 'application/octet-stream';
}

/** Mirrors the `accept` attribute: MIME types, `type/*` wildcards and extensions. */
export function acceptsFile(file: FileIdentity, accept: string): boolean {
  const tokens = accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = resolveFileMimeType(file).toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

const sizeUnits = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const;

export function formatFileSize(bytes: number, locale: Locale = 'en'): string {
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

export function describeFileItem(item: FileListItem, locale: Locale = 'en'): string {
  const size = formatFileSize(item.size, locale);
  return item.pageCount === undefined
    ? size
    : `${size} · ${fileWorkflowMessages[locale].pages(item.pageCount)}`;
}
