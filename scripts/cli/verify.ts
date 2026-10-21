import { build } from './build.ts';
import { check } from './check.ts';
import { e2e } from './e2e.ts';
import { assertInstalledDependencies } from './dependencies.ts';

export async function verify(): Promise<void> {
  assertInstalledDependencies();
  const results: string[] = [];
  const steps: Array<[string, () => void | Promise<void>]> = [
    ['check', () => check()],
    ['build', () => build()],
    ['pages', () => check('pages')],
    ['seo', () => check('seo')],
    ['e2e', () => e2e()]
  ];
  try {
    for (const [name, task] of steps) {
      console.log(`[verify] ${results.length + 1}/${steps.length} ${name}`);
      const started = performance.now();
      try {
        await task();
        results.push(`✔ ${name}: ${((performance.now() - started) / 1000).toFixed(1)}s`);
      } catch (error) {
        results.push(`✘ ${name}: ${((performance.now() - started) / 1000).toFixed(1)}s`);
        throw error;
      }
    }
    console.log('[verify] passed');
  } finally {
    console.log(`[verify] ${results.join(' | ')}`);
  }
}
