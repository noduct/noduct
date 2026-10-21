import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { assertFreshArtifact, sourceHash } from '../../scripts/cli/artifact.ts';
import {
  availableToolPorts,
  parseDevArgs,
  proxyEnvironment,
  toolPorts
} from '../../scripts/cli/dev.ts';
import { generateTool } from '../../scripts/cli/new-tool.ts';
import { selectedTools } from '../../scripts/cli/shared.ts';
import { rootDir } from '../../scripts/pages-manifest.ts';
import { rootScriptViolations } from '../../scripts/check-scripts.ts';
import { localAgentViolations } from '../../scripts/check-agents.ts';
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

  it('rejects a local AGENTS fixture that repeats the root workflow', () => {
    const fixture = 'Complementa [AGENTS.md](../../AGENTS.md).\n\n# Escopo local\n- Leia o contrato raiz.\n- Rode `npm run check` após alterar a área.\n';
    expect(localAgentViolations(fixture)).toContain('agent-scope');
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

  it('generates anchored WebSocket-aware proxies for overlapping slugs', async () => {
    const { devToolProxy } = await import('../../scripts/dev-proxy.mjs');
    const proxy = devToolProxy('split-pdf=4331,split-pdf-pages=4332');
    expect(proxy['^/split-pdf(?:[/?#]|$)']).toMatchObject({
      target: 'http://127.0.0.1:4331',
      ws: true
    });
    expect(proxy['^/split-pdf-pages(?:[/?#]|$)']).toMatchObject({
      target: 'http://127.0.0.1:4332'
    });
    expect(new RegExp('^/split-pdf(?:[/?#]|$)').test('/split-pdf-pages/')).toBe(false);
    expect(new RegExp('^/split-pdf(?:[/?#]|$)').test('/split-pdf/@vite/client')).toBe(true);
    expect(proxy['^/split-pdf(?:[/?#]|$)']?.selfHandleResponse).toBe(true);
    expect(() => devToolProxy('broken')).toThrow('Invalid NODUCT_DEV_TOOLS');
  });

  it('rewrites Vite paths across response chunks without changing unrelated paths', async () => {
    const { rewriteDevPaths, rewriteStream } = await import('../../scripts/dev-proxy.mjs');
    const source =
      '<script src="/@vite/client"></script><script src="/src/app.ts"></script> <a href="/about/">About</a>';
    expect(rewriteDevPaths(source, 'merge-pdf')).toContain('src="/merge-pdf/@vite/client"');
    expect(rewriteDevPaths(source, 'merge-pdf')).toContain('href="/about/"');
    const output: Buffer[] = [];
    const chunks = [
      Buffer.from(source.slice(0, 14)),
      Buffer.from(source.slice(14, 23)),
      Buffer.from(source.slice(23))
    ];
    for await (const chunk of Readable.from(chunks).pipe(rewriteStream('merge-pdf')))
      output.push(chunk as Buffer);
    expect(Buffer.concat(output).toString()).toBe(rewriteDevPaths(source, 'merge-pdf'));
  });

  it('parses selected tools and tool-only mode', () => {
    expect(parseDevArgs([])).toEqual({ only: false, slugs: [] });
    expect(parseDevArgs(['merge-pdf'])).toEqual({ only: false, slugs: ['merge-pdf'] });
    expect(parseDevArgs(['--only', 'merge-pdf'])).toEqual({ only: true, slugs: ['merge-pdf'] });
    expect(() => parseDevArgs(['--only'])).toThrow('Usage:');
    expect(() => parseDevArgs(['--unknown'])).toThrow('Unknown dev option');
  });

  it('rejects missing and stale Pages artifacts', () => {
    const dir = temp();
    expect(() => assertFreshArtifact(dir, 'expected')).toThrow('missing');
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    writeFileSync(join(dir, '.build-info.json'), JSON.stringify({ sourceHash: 'old' }));
    expect(() => assertFreshArtifact(dir, 'expected')).toThrow('stale');
    expect(() => assertFreshArtifact(dir, 'old')).not.toThrow();
  });

  it('hashes public assets but ignores package test output', () => {
    const root = temp();
    mkdirSync(join(root, 'public/brand'), { recursive: true });
    mkdirSync(join(root, 'packages/example/src'), { recursive: true });
    writeFileSync(join(root, 'packages/example/src/index.ts'), 'export const value = 1;');
    writeFileSync(join(root, 'public/brand/logo.svg'), '<svg />');
    const before = sourceHash(root);
    writeFileSync(join(root, 'public/brand/logo.svg'), '<svg id="changed" />');
    const changed = sourceHash(root);
    expect(changed).not.toBe(before);
    mkdirSync(join(root, 'packages/example/test-results'), { recursive: true });
    writeFileSync(join(root, 'packages/example/test-results/a.txt'), 'test output');
    expect(sourceHash(root)).toBe(changed);
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
    expect(readFileSync(join(dir, 'packages/sample-tool/AGENTS.md'), 'utf8')).toContain(
      'packages/sample-tool/'
    );
    expect(() => generateTool('sample-tool', 'text-tools', dir)).toThrow('already exists');
    expect(readFileSync(join(dir, 'src/data/tools.json'), 'utf8')).toBe(catalog);
  });

  it('rolls back a generation that fails after staging has begun', () => {
    const dir = temp();
    mkdirSync(join(dir, 'packages'), { recursive: true });
    mkdirSync(join(dir, 'src/data'), { recursive: true });
    mkdirSync(join(dir, 'src/i18n/catalog'), { recursive: true });
    cpSync(join(rootDir, 'packages/tool-template'), join(dir, 'packages/tool-template'), {
      recursive: true
    });
    rmSync(join(dir, 'packages/tool-template/src/config.ts'));
    writeFileSync(join(dir, 'src/data/tools.json'), '[]');
    for (const locale of ['pt-BR', 'es'])
      writeFileSync(join(dir, `src/i18n/catalog/${locale}.json`), '{}');
    expect(() => generateTool('sample-tool', 'text-tools', dir)).toThrow();
    expect(existsSync(join(dir, 'packages/sample-tool'))).toBe(false);
    expect(readFileSync(join(dir, 'src/data/tools.json'), 'utf8')).toBe('[]');
    for (const locale of ['pt-BR', 'es'])
      expect(readFileSync(join(dir, `src/i18n/catalog/${locale}.json`), 'utf8')).toBe('{}');
  });
});
