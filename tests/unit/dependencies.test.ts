import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertInstalledDependencies } from '../../scripts/cli/dependencies';

describe('installed dependency check', () => {
  it('reports stale or missing local installs before verify invokes package binaries', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'noduct-deps-'));
    try {
      mkdirSync(join(workspace, 'node_modules'));
      writeFileSync(
        join(workspace, 'package.json'),
        JSON.stringify({
          dependencies: { stylelint: '17.16.0' },
          devDependencies: {}
        })
      );
      writeFileSync(
        join(workspace, 'package-lock.json'),
        JSON.stringify({
          packages: { 'node_modules/stylelint': { version: '17.16.0' } }
        })
      );
      expect(() => assertInstalledDependencies(workspace)).toThrow(/rode npm ci/);
      writeFileSync(
        join(workspace, 'node_modules', '.package-lock.json'),
        JSON.stringify({
          packages: { 'node_modules/stylelint': { version: '17.15.0' } }
        })
      );
      expect(() => assertInstalledDependencies(workspace)).toThrow(/rode npm ci/);
      writeFileSync(
        join(workspace, 'node_modules', '.package-lock.json'),
        JSON.stringify({
          packages: { 'node_modules/stylelint': { version: '17.16.0' } }
        })
      );
      expect(() => assertInstalledDependencies(workspace)).not.toThrow();
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
});
