import { RESERVED_HUB_SEGMENTS } from '@noduct/tool-runtime';

/** Caminhos sempre relativos à raiz. Alterações nestas listas passam pelo ratchet. */
export const guardrails = {
  controlFiles: [
    'guardrails.config.ts', 'eslint.config.js', 'stylelint.config.mjs',
    'playwright.config.ts', 'tsconfig.json', 'package.json',
    '.github/CODEOWNERS', '.github/workflows/', 'eslint-rules/',
    'scripts/check-guardrail-ratchet.ts', 'scripts/check-scripts.ts',
    'scripts/check-agents.ts', 'scripts/validate-ui.ts',
    'scripts/validate-architecture.ts', 'scripts/cli/check.ts',
    'scripts/cli/verify.ts', 'scripts/cli/ratchet-base.ts',
    'scripts/eslint-formatter.mjs', 'scripts/stylelint-formatter.mjs',
    'scripts/guardrail-skip-baseline.json',
    'tests/e2e/shell-parity.spec.ts',
    'packages/design-system/src/icons/registry.ts'
  ],
  rawSvgFiles: [
    'packages/design-system/src/icons/Icon.astro',
    'packages/design-system/src/icons/IconSprite.astro',
    'packages/design-system/src/shell/BrandMark.astro'
  ],
  shelllessFixturePages: [
    'tests/fixtures/sponsorship-app/src/pages/[scenario].astro',
    'tests/fixtures/sponsorship-app/src/pages/file-workflow.astro'
  ],
  violationFixtureFiles: [
    'tests/fixtures/guardrails/deprecated-name.case',
    'tests/fixtures/guardrails/domain-browser.case',
    'tests/fixtures/guardrails/page-no-shell.case',
    'tests/fixtures/guardrails/pr-labeled.case',
    'tests/fixtures/guardrails/ratchet-control-paths.case',
    'tests/fixtures/guardrails/ui-bypasses.case'
  ],
  brandTexts: ['Noduct'],
  legacyUrlFiles: [
    'packages/tool-runtime/src/topology.ts',
    'packages/tool-runtime/src/topology.test.ts',
    'scripts/validate-pages.ts',
    // Validator contains the forbidden-pattern fixture it searches for.
    'scripts/validate-ui.ts'
  ],
  hardcodedTextFiles: [],
  inlineScriptFiles: ['packages/design-system/src/shell/AppShell.astro']
} as const;

export { RESERVED_HUB_SEGMENTS };
