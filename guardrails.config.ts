import { RESERVED_HUB_SEGMENTS } from '@noduct/tool-runtime';

/** Caminhos sempre relativos à raiz. Alterações nestas listas passam pelo ratchet. */
export const guardrails = {
  rawSvgFiles: [
    'packages/design-system/src/icons/Icon.astro',
    'packages/design-system/src/icons/IconSprite.astro',
    'packages/design-system/src/shell/BrandMark.astro'
  ],
  brandTexts: ['Noduct'],
  exemptFixtures: ['tests/fixtures/guardrails/', 'tests/fixtures/sponsorship-app/'],
  legacyUrlFiles: [
    'packages/tool-runtime/src/topology.ts',
    'packages/tool-runtime/src/topology.test.ts',
    'scripts/assemble-pages.ts',
    'scripts/validate-pages.ts'
  ],
  hardcodedTextFiles: [],
  inlineScriptFiles: [
    'packages/design-system/src/shell/AppShell.astro',
    'packages/design-system/src/shell/SiteHeader.astro'
  ]
} as const;

export { RESERVED_HUB_SEGMENTS };
