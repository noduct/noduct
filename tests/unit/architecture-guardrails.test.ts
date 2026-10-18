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
});
