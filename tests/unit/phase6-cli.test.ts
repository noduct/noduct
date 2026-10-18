import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { assertFreshArtifact } from '../../scripts/cli/artifact.ts';
import { availableToolPorts, proxyEnvironment, toolPorts } from '../../scripts/cli/dev.ts';
import { generateTool } from '../../scripts/cli/new-tool.ts';
import { selectedTools } from '../../scripts/cli/shared.ts';
import { rootDir } from '../../scripts/pages-manifest.ts';
import { rootScriptViolations } from '../../scripts/check-scripts.ts';
import { validateUiContent } from '../../scripts/validate-ui.ts';

const temporary: string[] = [];
afterEach(() =>
  temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true }))
);

function temp(): string {
  const path = mkdtempSync(join(tmpdir(), 'noduct-cli-'));
  temporary.push(path);
  return path;
}

describe('workspace CLI', () => {
  it('resolves tools through the package manifest and rejects unknown slugs', () => {
    expect(selectedTools([]).length).toBeGreaterThan(0);
    expect(selectedTools(['merge-pdf']).map((tool) => tool.slug)).toEqual(['merge-pdf']);
    expect(() => selectedTools(['unknown-tool'])).toThrow('Unknown tool');
  });

  it('rejects a root script tied to a tool', () => {
    const scripts = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(rootScriptViolations({ ...scripts.scripts, 'dev:merge-pdf': 'astro dev' })).toContain(
      'Unexpected root script: dev:merge-pdf'
    );
  });

  it('keeps generated translations blocked until reviewed', () => {
    expect(
      validateUiContent(
        'packages/sample-tool/src/i18n.ts',
        "export const name = 'TODO(i18n): Sample';"
      )
    ).toContain('unresolved i18n placeholder');
    expect(
      validateUiContent('src/i18n/catalog/es.json', '{"sample-tool":{"name":"TODO(i18n)"}}')
    ).toContain('unresolved i18n placeholder');
  });

  it('assigns stable ports and passes them to the hub proxy', () => {
    const ports = toolPorts(['a-tool', 'b-tool']);
    expect([...ports.values()]).toEqual([4331, 4332]);
    expect(proxyEnvironment(ports)).toBe('a-tool=4331,b-tool=4332');
  });

  it('skips a port already occupied by another local process', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Expected TCP address');
      const ports = await availableToolPorts(['sample-tool'], address.port);
      expect(ports.get('sample-tool')).toBeGreaterThan(address.port);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('generates a WebSocket-aware proxy for each declared tool', async () => {
    const { devToolProxy } = await import('../../astro.config.mjs');
    expect(devToolProxy('a-tool=4331')['/a-tool']).toMatchObject({
      target: 'http://127.0.0.1:4331',
      ws: true
    });
    expect(() => devToolProxy('broken')).toThrow('Invalid NODUCT_DEV_TOOLS');
  });

  it('rejects missing and stale Pages artifacts', () => {
    const dir = temp();
    expect(() => assertFreshArtifact(dir, 'expected')).toThrow('missing');
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    writeFileSync(join(dir, '.build-info.json'), JSON.stringify({ sourceHash: 'old' }));
    expect(() => assertFreshArtifact(dir, 'expected')).toThrow('stale');
    expect(() => assertFreshArtifact(dir, 'old')).not.toThrow();
  });

  it('generates a tool atomically and refuses a duplicate without changing files', () => {
    const dir = temp();
    mkdirSync(join(dir, 'packages'), { recursive: true });
    mkdirSync(join(dir, 'src/data'), { recursive: true });
    mkdirSync(join(dir, 'src/i18n/catalog'), { recursive: true });
    cpSync(join(rootDir, 'packages/tool-template'), join(dir, 'packages/tool-template'), {
      recursive: true
    });
    writeFileSync(join(dir, 'src/data/tools.json'), '[]');
    for (const locale of ['pt-BR', 'es'])
      writeFileSync(join(dir, `src/i18n/catalog/${locale}.json`), '{}');
    expect(() => generateTool('tools', 'text-tools', dir)).toThrow();
    expect(() => generateTool('sample-tool', 'invalid', dir)).toThrow();
    generateTool('sample-tool', 'text-tools', dir);
    const catalog = readFileSync(join(dir, 'src/data/tools.json'), 'utf8');
    expect(catalog).toContain('sample-tool');
    expect(readFileSync(join(dir, 'packages/sample-tool/src/config.ts'), 'utf8')).toContain(
      "slug: 'sample-tool'"
    );
    expect(() => generateTool('sample-tool', 'text-tools', dir)).toThrow('already exists');
    expect(readFileSync(join(dir, 'src/data/tools.json'), 'utf8')).toBe(catalog);
  });
});
