import { describe, expect, it } from 'vitest';
import { validateArchitecture, type ArchitectureFile } from '../../scripts/validate-architecture';

const manifests: ArchitectureFile[] = [
  {
    path: 'packages/tool-runtime/package.json',
    content: JSON.stringify({ name: '@noduct/tool-runtime', exports: { '.': './src/index.ts' } })
  },
  {
    path: 'packages/design-system/package.json',
    content: JSON.stringify({
      name: '@noduct/design-system',
      exports: { '.': './src/index.ts', './shell/AppShell.astro': './src/shell/AppShell.astro' },
      dependencies: { '@noduct/tool-runtime': '*' }
    })
  },
  {
    path: 'packages/pdf-core/package.json',
    content: JSON.stringify({ name: '@noduct/pdf-core', exports: { '.': './src/index.ts' } })
  },
  {
    path: 'packages/workspace-core/package.json',
    content: JSON.stringify({
      name: '@noduct/workspace-core',
      exports: { '.': './src/index.ts' },
      dependencies: { '@noduct/tool-runtime': '*' }
    })
  }
];

function source(path: string, content: string): ArchitectureFile {
  return { path, content };
}

describe('architecture guardrail', () => {
  it('accepts public imports in the permitted dependency direction', () => {
    expect(
      validateArchitecture([
        ...manifests,
        source(
          'packages/design-system/src/shell/AppShell.astro',
          `---\nimport { topology } from '@noduct/tool-runtime';\n---`
        ),
        source(
          'packages/merge-pdf/src/pages/index.astro',
          `---\nimport AppShell from '@noduct/design-system/shell/AppShell.astro';\n---`
        )
      ])
    ).toEqual([]);
  });

  it('rejects private imports from tests and Astro scripts', () => {
    const violations = validateArchitecture([
      ...manifests,
      source('tests/unit/private.test.ts', `import { x } from '../../packages/pdf-core/src/core';`),
      source(
        'packages/merge-pdf/src/pages/index.astro',
        `---\n---\n<script>import { x } from '../../../../packages/tool-runtime/src/topology';</script>`
      )
    ]);
    expect(
      violations.filter((violation) => violation.message.includes('Private cross-package import'))
    ).toHaveLength(2);
  });

  it('rejects imports outside package exports and imports of domain packages by the hub', () => {
    const violations = validateArchitecture([
      ...manifests,
      source(
        'src/pages/index.astro',
        `---\nimport { x } from '@noduct/pdf-core';\nimport { y } from '@noduct/design-system/shell/private';\n---`
      )
    ]);
    expect(violations.map((violation) => violation.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Hub must not import @noduct/pdf-core'),
        expect.stringContaining('is not a public package export')
      ])
    );
  });

  it('rejects reversed dependencies and cycles declared in manifests', () => {
    const violations = validateArchitecture([
      source(
        'packages/tool-runtime/package.json',
        JSON.stringify({
          name: '@noduct/tool-runtime',
          exports: { '.': './src/index.ts' },
          dependencies: { '@noduct/design-system': '*' }
        })
      ),
      manifests[1]!,
      manifests[2]!,
      manifests[3]!
    ]);
    expect(violations.map((violation) => violation.message)).toEqual(
      expect.arrayContaining([
        'tool-runtime must not depend on another internal package',
        expect.stringContaining('Dependency cycle:')
      ])
    );
  });

  it.each(['mts', 'cts'])('rejects private imports from untracked .%s files', (extension) => {
    const violations = validateArchitecture([
      ...manifests,
      source(`packages/merge-pdf/src/new.${extension}`, "import '../../pdf-core/dist/private.js';")
    ]);
    expect(violations.map((violation) => violation.message)).toContainEqual(
      expect.stringContaining('Private cross-package import')
    );
  });

  it('rejects CSS imports into another package internals', () => {
    const violations = validateArchitecture([
      ...manifests,
      source('src/styles/fixture.css', "@import '../../packages/design-system/src/tokens.css';")
    ]);
    expect(violations.map((violation) => violation.message)).toContainEqual(
      expect.stringContaining('Private cross-package import')
    );
  });

  it('confines PDF.js to the pdf-core renderer and workspace islands in the hub (ADR 0006)', () => {
    const renderManifest = source(
      'packages/pdf-core/package.json',
      JSON.stringify({
        name: '@noduct/pdf-core',
        exports: { '.': './src/index.ts', './render': './src/render/index.ts' },
        dependencies: { 'pdf-lib': '1.17.1', 'pdfjs-dist': '6.3.289' }
      })
    );
    const files = [
      manifests[0]!,
      manifests[1]!,
      manifests[3]!,
      renderManifest,
      source('packages/pdf-core/src/render/index.ts', "import('pdfjs-dist/legacy/build/pdf.mjs');"),
      source('packages/pdf-core/src/core.ts', "import { getDocument } from 'pdfjs-dist';"),
      source(
        'src/components/workspace/WorkspaceIsland.astro',
        "<script>import('@noduct/workspace-core'); import('@noduct/pdf-core/render');</script>"
      ),
      source('src/components/pages/HomePage.astro', "<script>import('@noduct/workspace-core');</script>"),
      source('src/components/workspace/Other.astro', "<script>import('@noduct/pdf-core');</script>")
    ];
    const messages = validateArchitecture(files).map((violation) => [violation.path, violation.message]);
    expect(messages).toEqual([
      ['packages/pdf-core/src/core.ts', 'pdf-core must not import pdfjs-dist'],
      ['src/components/pages/HomePage.astro', 'Hub must not import @noduct/workspace-core'],
      ['src/components/workspace/Other.astro', 'Hub must not import @noduct/pdf-core']
    ]);
  });

  it('rejects Astro dependency and imports in pure domain packages', () => {
    const violations = validateArchitecture([
      source('packages/pdf-core/package.json', JSON.stringify({ name: '@noduct/pdf-core', dependencies: { astro: '^5' } })),
      manifests[0]!, manifests[1]!, manifests[3]!,
      source('packages/tool-runtime/src/fixture.ts', "import { z } from 'astro/zod';")
    ]);
    expect(violations.map((violation) => violation.message)).toContain('pdf-core must not depend on astro');
    expect(violations.map((violation) => violation.message)).toContain('tool-runtime must not import astro/zod');
  });
});
