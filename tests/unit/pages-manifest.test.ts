import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deployedTools } from '../../scripts/pages-manifest';

describe('GitHub Pages tool manifest', () => {
  it('keeps each deployed package slug equal to its defineTool declaration', async () => {
    const tools = deployedTools();
    expect(tools.length).toBeGreaterThan(0);

    for (const deployed of tools) {
      const manifest = JSON.parse(
        readFileSync(join(deployed.packageDir, 'package.json'), 'utf8')
      ) as { noduct?: { slug?: string } };
      const configUrl = pathToFileURL(join(deployed.packageDir, 'src', 'config.ts')).href;
      const config = (await import(configUrl)) as { tool?: { slug?: string } };

      expect(manifest.noduct?.slug).toBe(deployed.slug);
      expect(config.tool?.slug).toBe(deployed.slug);
    }
  });
});
