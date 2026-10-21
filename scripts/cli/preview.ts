import { assertFreshArtifact } from './artifact.ts';
import { run } from './shared.ts';

export function preview(): void {
  assertFreshArtifact();
  run('node', ['scripts/serve-pages.mjs']);
}
