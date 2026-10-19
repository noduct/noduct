import { build } from './build.ts';
import { check } from './check.ts';
import { e2e } from './e2e.ts';
import { assertInstalledDependencies } from './dependencies.ts';

export async function verify(): Promise<void> {
  assertInstalledDependencies();
  console.log('[verify] 1/5 check');
  check();
  console.log('[verify] 2/5 build');
  await build();
  console.log('[verify] 3/5 pages');
  check('pages');
  console.log('[verify] 4/5 seo');
  check('seo');
  console.log('[verify] 5/5 e2e');
  e2e();
  console.log('[verify] passed');
}
