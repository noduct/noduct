import { assertE2eFixture, assertFreshArtifact } from './artifact.ts';
import { localBin, run } from './shared.ts';

export function e2e(args: string[] = []): void {
  assertFreshArtifact();
  assertE2eFixture();
  run(localBin('playwright'), ['test', ...args]);
}
