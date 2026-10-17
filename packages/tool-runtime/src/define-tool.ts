import type { CategoryId } from './taxonomy.ts';
import { assertToolSlug, toolScope, type Scope } from './topology.ts';

export const TOOL_STATUSES = ['planned', 'beta', 'published', 'ready', 'new'] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export interface ToolManifestInput {
  readonly slug: string;
  readonly category: CategoryId;
  /** Indexável e com links operacionais somente quando publicado. */
  readonly published: boolean;
  readonly sponsorPlacementId?: string | undefined;
  readonly sponsorshipEnabled?: boolean | undefined;
}

export interface ToolManifest extends ToolManifestInput {
  readonly scope: Scope;
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
    sponsorPlacementId: input.sponsorPlacementId ?? `${input.slug}.primary`,
    sponsorshipEnabled: input.sponsorshipEnabled ?? false
  });
}
