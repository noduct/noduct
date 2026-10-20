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
export const checkNames = Object.freeze(Object.keys(checks));

function timedStep(name: string, task: () => void, results: string[]): void {
  const started = performance.now();
  try {
    task();
    results.push(`✔ ${name}: ${((performance.now() - started) / 1000).toFixed(1)}s`);
  } catch (error) {
    results.push(`✘ ${name}: ${((performance.now() - started) / 1000).toFixed(1)}s`);
    throw error;
  }
}

export function check(name?: string): void {
  const results: string[] = [];
  try {
  if (name) {
    const task = checks[name];
    if (!task)
      throw new Error(`Unknown check: ${name}. Available: ${Object.keys(checks).join(', ')}`);
    timedStep(name, task, results);
    return;
  }
  timedStep('lint', () => run(localBin('eslint'), ['.', '--config', 'eslint.config.js', '--max-warnings', '0', '--format', './scripts/eslint-formatter.mjs']), results);
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
    if (checks[key]) timedStep(key, checks[key], results);
  timedStep('unit', () => run(localBin('vitest'), ['run']), results);
  console.log('Check passed.');
  } finally {
    console.log(`[check] ${results.join(' | ')}`);
  }
}
