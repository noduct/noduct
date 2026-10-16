import { defineTool } from '@noduct/tool-runtime';

/*
 * Declaração da ferramenta (ADR 0005). URLs, canonical e site/base do Astro derivam do slug via
 * @noduct/tool-runtime. `published` acompanha o status do catálogo do hub: enquanto o merge-pdf
 * estiver `planned`, a página fica `noindex` (AGENTS.md).
 */
export const tool = defineTool({
  slug: 'merge-pdf',
  category: 'pdf-tools',
  published: false,
  sponsorshipEnabled: false
});
