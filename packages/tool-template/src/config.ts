import { defineTool } from '@noduct/tool-runtime';

/*
 * Troque o slug e a categoria ao criar uma ferramenta. URLs, canonical e site/base do Astro
 * derivam daqui via @noduct/tool-runtime — nunca escreva URLs do produto à mão.
 */
export const tool = defineTool({
  slug: 'example-tool',
  category: 'text-tools',
  accept: 'text/plain,.txt',
  published: false,
  sponsorshipEnabled: false
});
