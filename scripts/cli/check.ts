import { deployedTools } from '../pages-manifest.ts';
import { resolveRatchetBase } from './ratchet-base.ts';
import { assertFreshArtifact } from './artifact.ts';
import { localBin, run } from './shared.ts';

const tsx = localBin('tsx');
const checks: Record<string, () => void> = {
  css: () =>
    run(localBin('stylelint'), [
      'src/**/*.{css,astro}',
      'packages/*/src/**/*.{css,astro}',
      '--config',
      'stylelint.config.mjs',
      '--custom-formatter',
      'scripts/stylelint-formatter.mjs'
    ]),
  types: () => {
    run(localBin('astro'), ['check']);
    for (const tool of deployedTools())
      run(localBin('astro'), ['check', '--root', tool.packageDir]);
    run(localBin('astro'), ['check', '--root', 'packages/tool-template']);
  },
  catalog: () => run(tsx, ['scripts/validate-catalog.ts']),
  i18n: () => run(tsx, ['scripts/validate-i18n.ts']),
  sponsors: () => {
    run(tsx, ['scripts/validate-sponsors.ts']);
    run(tsx, ['scripts/validate-sponsorship-registry.ts']);
  },
  ui: () => run(tsx, ['scripts/validate-ui.ts']),
  architecture: () => run(tsx, ['scripts/validate-architecture.ts']),
  ratchet: () =>
    run(tsx, [
      'scripts/check-guardrail-ratchet.ts',
      '--base',
      resolveRatchetBase()
    ]),
  scripts: () => run(tsx, ['scripts/check-scripts.ts']),
  agents: () => run(tsx, ['scripts/check-agents.ts']),
  pages: () => {
    assertFreshArtifact();
    run(tsx, ['scripts/validate-pages.ts']);
  },
  seo: () => {
    assertFreshArtifact();
    run(tsx, ['scripts/validate-seo.ts']);
  }
};

export function check(name?: string): void {
  if (name) {
    const task = checks[name];
    if (!task)
      throw new Error(`Unknown check: ${name}. Available: ${Object.keys(checks).join(', ')}`);
    task();
    return;
  }
  run(localBin('eslint'), ['.', '--config', 'eslint.config.js', '--max-warnings', '0', '--format', './scripts/eslint-formatter.mjs']);
  for (const key of [
    'css',
    'ui',
    'architecture',
    'ratchet',
    'scripts',
    'agents',
    'types',
    'catalog',
    'i18n',
    'sponsors'
  ])
    checks[key]?.();
  run(localBin('vitest'), ['run']);
  console.log('Check passed.');
}
