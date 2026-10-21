import type { CategoryId } from './taxonomy.ts';
import { assertToolSlug, toolScope, type Scope } from './topology.ts';

export const TOOL_STATUSES = ['planned', 'beta', 'published', 'ready', 'new'] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

/** Formatos de arquivo padrão por categoria de ferramenta. */
export const CATEGORY_DEFAULT_ACCEPT: Readonly<Record<CategoryId, string>> = {
  'pdf-tools': 'application/pdf,.pdf',
  'image-tools':
    'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/bmp,image/tiff,.png,.jpg,.jpeg,.webp,.gif,.avif,.svg,.bmp,.tif,.tiff',
  'text-tools': 'text/plain,text/markdown,.txt,.md,.markdown',
  'data-tools':
    'text/csv,text/tab-separated-values,application/json,application/xml,text/xml,.csv,.tsv,.json,.xml,.xlsx,.xls,.ods',
  'developer-tools':
    'application/json,application/xml,text/xml,text/html,text/css,text/javascript,application/javascript,text/plain,.json,.xml,.html,.htm,.css,.js,.mjs,.cjs,.ts,.tsx,.jsx,.yaml,.yml,.txt',
  'general-utilities': ''
};

export interface ToolManifestInput {
  readonly slug: string;
  readonly category: CategoryId;
  /** Indexável e com links operacionais somente quando publicado. */
  readonly published: boolean;
  /** Formatos de arquivo aceitos pela ferramenta (MIME types e extensões separados por vírgula). */
  readonly accept?: string | undefined;
  readonly sponsorPlacementId?: string | undefined;
  readonly sponsorshipEnabled?: boolean | undefined;
}

export interface ToolManifest extends ToolManifestInput {
  readonly scope: Scope;
  readonly accept: string;
  readonly sponsorPlacementId: string;
  readonly sponsorshipEnabled: boolean;
}

/**
 * Declaração tipada de uma ferramenta. URLs, canonical, hreflang e o `site`/`base` do Astro saem
 * de `topology` a partir do `scope` devolvido aqui — a ferramenta nunca escreve URLs à mão.
 */
export function defineTool(input: ToolManifestInput): ToolManifest {
  assertToolSlug(input.slug);
  return Object.freeze({
    ...input,
    scope: toolScope(input.slug),
    accept: input.accept ?? CATEGORY_DEFAULT_ACCEPT[input.category],
    sponsorPlacementId: input.sponsorPlacementId ?? `${input.slug}.primary`,
    sponsorshipEnabled: input.sponsorshipEnabled ?? false
  });
}
