import { readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export interface ArchitectureFile {
  readonly path: string;
  readonly content: string;
}

export interface ArchitectureViolation {
  readonly path: string;
  readonly message: string;
}

const SOURCE_EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|astro|css)$/;
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function normalize(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function packageDirectory(path: string): string | undefined {
  return /^packages\/([^/]+)\//.exec(path)?.[1];
}

function sourceSlices(file: ArchitectureFile): string[] {
  if (!file.path.endsWith('.astro')) return [file.content];
  const result: string[] = [];
  const frontmatter = /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(file.content);
  if (frontmatter) result.push(frontmatter[1] ?? '');
  for (const match of file.content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    result.push(match[1] ?? '');
  }
  return result;
}

export function importedSpecifiers(file: ArchitectureFile): string[] {
  const imports: string[] = [];
  if (file.path.endsWith('.css'))
    return [...file.content.matchAll(/@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');
  for (const source of sourceSlices(file)) {
    const ast = ts.createSourceFile(file.path + '.ts', source, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        imports.push(node.moduleSpecifier.text);
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression &&
        ts.isStringLiteralLike(node.moduleReference.expression)
      ) {
        imports.push(node.moduleReference.expression.text);
      } else if (
        ts.isCallExpression(node) &&
        node.arguments.length === 1 &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
        ts.isStringLiteralLike(node.arguments[0]!)
      ) {
        imports.push(node.arguments[0]!.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  return imports;
}

function packageName(specifier: string): string | undefined {
  return /^(@noduct\/[^/]+)/.exec(specifier)?.[1];
}

function findCycle(edges: Map<string, Set<string>>): string[] | undefined {
  const visited = new Set<string>();
  const active = new Set<string>();
  const trail: string[] = [];
  const visit = (name: string): string[] | undefined => {
    if (active.has(name)) return [...trail.slice(trail.indexOf(name)), name];
    if (visited.has(name)) return undefined;
    visited.add(name);
    active.add(name);
    trail.push(name);
    for (const dependency of edges.get(name) ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    trail.pop();
    active.delete(name);
    return undefined;
  };
  for (const name of edges.keys()) {
    const cycle = visit(name);
    if (cycle) return cycle;
  }
  return undefined;
}

export function validateArchitecture(files: readonly ArchitectureFile[]): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const manifests = new Map<string, { readonly name: string; readonly exports: Set<string> }>();
  const names = new Map<string, string>();
  const edges = new Map<string, Set<string>>();

  for (const file of files) {
    const path = normalize(file.path);
    if (!/^packages\/[^/]+\/package\.json$/.test(path)) continue;
    const directory = packageDirectory(path)!;
    try {
      const manifest = JSON.parse(file.content) as Record<string, unknown>;
      if (typeof manifest.name !== 'string') throw new Error('missing package name');
      const exportsField = manifest.exports;
      const exports = new Set<string>();
      if (typeof exportsField === 'object' && exportsField !== null) {
        for (const key of Object.keys(exportsField)) exports.add(key);
      } else if (typeof exportsField === 'string') {
        exports.add('.');
      }
      manifests.set(directory, { name: manifest.name, exports });
      names.set(manifest.name, directory);
      edges.set(directory, new Set());
    } catch (error) {
      violations.push({ path, message: `Invalid package manifest: ${String(error)}` });
    }
  }

  const addEdge = (source: string | undefined, target: string | undefined, path: string): void => {
    if (!source || !target || source === target) return;
    edges.get(source)?.add(target);
    if (source === 'tool-runtime') {
      violations.push({
        path,
        message: 'tool-runtime must not depend on another internal package'
      });
    } else if (source === 'design-system' && target !== 'tool-runtime') {
      violations.push({ path, message: `design-system must not depend on ${target}` });
    } else if (source === 'pdf-core') {
      violations.push({ path, message: `pdf-core must not depend on ${target}` });
    } else if (source === 'workspace-core' && target !== 'tool-runtime') {
      violations.push({ path, message: `workspace-core must not depend on ${target}` });
    }
  };

  for (const file of files) {
    const path = normalize(file.path);
    if (!/^packages\/[^/]+\/package\.json$/.test(path)) continue;
    const source = packageDirectory(path)!;
    const manifest = JSON.parse(file.content) as Record<string, Record<string, string>>;
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      for (const dependency of Object.keys(manifest[field] ?? {})) {
        if ((source === 'pdf-core' || source === 'tool-runtime') &&
            !dependency.startsWith('@noduct/') &&
            !(source === 'pdf-core' && dependency === 'pdf-lib'))
          violations.push({ path, message: `${source} must not depend on ${dependency}` });
        const target = names.get(dependency);
        addEdge(source, target, path);
      }
    }
  }

  for (const file of files) {
    const path = normalize(file.path);
    if (!SOURCE_EXTENSIONS.test(path)) continue;
    const source = packageDirectory(path);
    for (const specifier of importedSpecifiers(file)) {
      if ((source === 'pdf-core' || source === 'tool-runtime') &&
          !/\.test\.[cm]?[jt]sx?$/.test(path) &&
          !specifier.startsWith('.') && !specifier.startsWith('node:') &&
          !specifier.startsWith('@noduct/') &&
          !(source === 'pdf-core' && specifier === 'pdf-lib'))
        violations.push({ path, message: `${source} must not import ${specifier}` });
      const namedPackage = packageName(specifier);
      if (namedPackage && names.has(namedPackage)) {
        const target = names.get(namedPackage)!;
        const publicPath = specifier.slice(namedPackage.length);
        const exportKey = publicPath ? `.${publicPath}` : '.';
        if (!manifests.get(target)!.exports.has(exportKey)) {
          violations.push({ path, message: `Import ${specifier} is not a public package export` });
        }
        if (path.startsWith('src/') && (target === 'pdf-core' || target === 'workspace-core')) {
          violations.push({ path, message: `Hub must not import ${namedPackage}` });
        }
        addEdge(source, target, path);
        continue;
      }
      if (!specifier.startsWith('.')) continue;
      const resolved = normalize(relative(ROOT, resolve(ROOT, dirname(path), specifier)));
      const target = packageDirectory(resolved);
      if (target && target !== source) {
        violations.push({
          path,
          message: `Private cross-package import ${specifier}; use a public export`
        });
        addEdge(source, target, path);
      }
      if (path.startsWith('src/') && (target === 'pdf-core' || target === 'workspace-core')) {
        violations.push({ path, message: `Hub must not import ${target}` });
      }
    }
  }

  const cycle = findCycle(edges);
  if (cycle)
    violations.push({ path: 'packages/', message: `Dependency cycle: ${cycle.join(' -> ')}` });
  return violations;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { execFileSync } = await import('node:child_process');
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(
      (path) =>
        path && (SOURCE_EXTENSIONS.test(path) || /packages\/[^/]+\/package\.json$/.test(path))
    );
  const files = paths.map((path) => ({ path, content: readFileSync(resolve(ROOT, path), 'utf8') }));
  const violations = validateArchitecture(files);
  for (const violation of violations) {
    const source = files.find((file) => file.path === violation.path)?.content ?? '';
    const clue = /(?:Import |import )([^ ;]+)/.exec(violation.message)?.[1];
    const line =
      clue && source.includes(clue) ? source.slice(0, source.indexOf(clue)).split('\n').length : 1;
    console.error(
      `[architecture-boundary] ${violation.path}:${line} — ${violation.message}. Dependências invertidas impedem o isolamento e extração dos pacotes. Use exports públicos na direção do ADR 0003; veja docs/adr/0003-package-and-repository-strategy.md. Ver docs/guardrails.md#architecture-boundary`
    );
  }
  if (violations.length > 0) process.exitCode = 1;
  else console.log(`Architecture validation passed (${files.length} files).`);
}
