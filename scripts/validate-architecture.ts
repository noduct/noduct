import { readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { guardrails } from '../guardrails.config.ts';
export const GUARDRAIL_IDS = ['architecture-boundary', 'architecture-doc'];

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

// As fronteiras são dados em guardrails.config.ts; este validador só as aplica.
interface PackageBoundary {
  readonly role: string;
  readonly internal: readonly string[];
  readonly external: readonly string[] | null;
}
const BOUNDARIES: Readonly<Record<string, PackageBoundary>> = guardrails.architecture.packages;
const { scopedExternal, hub: HUB } = guardrails.architecture;

function externalName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

function allowedExternal(source: string, path: string, dependency: string): boolean {
  const allowed = BOUNDARIES[source]?.external;
  if (!allowed) return true;
  if (!allowed.includes(dependency)) return false;
  const scope = scopedExternal.find((entry) => entry.dependency === dependency);
  return !scope || path.endsWith('package.json') || path.startsWith(scope.directory);
}

function hubMayImport(path: string, specifier: string): boolean {
  return HUB.exceptions.some(
    (entry) =>
      path.startsWith(entry.directory) && (entry.imports as readonly string[]).includes(specifier)
  );
}

export function boundariesMarkdown(): string {
  const rows = Object.entries(BOUNDARIES).map(([name, boundary]) => {
    const internal = boundary.internal.length
      ? boundary.internal.map((item) => `\`${item}\``).join(', ')
      : 'nenhum';
    const external =
      boundary.external === null
        ? 'sem restrição'
        : boundary.external.length
          ? boundary.external.map((item) => `\`${item}\``).join(', ')
          : 'nenhuma';
    return `| \`${name}\` | ${boundary.role} | ${internal} | ${external} |`;
  });
  const scoped = scopedExternal.map(
    (entry) => `- \`${entry.dependency}\` só em \`${entry.directory}\`.`
  );
  const hubRules = [
    `- O hub (\`src/\`) não importa ${HUB.forbidden.map((item) => `\`${item}\``).join(' nem ')}, exceto:`,
    ...HUB.exceptions.map(
      (entry) =>
        `  - em \`${entry.directory}\`: ${entry.imports.map((item) => `\`${item}\``).join(', ')}.`
    )
  ];
  return [
    '| Pacote | Responsabilidade | Pacotes internos permitidos | Dependências externas |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    'Ferramentas (`packages/<slug>/`) e o template compõem esses pacotes pelos exports públicos.',
    '',
    ...scoped,
    ...hubRules,
    '- Imports entre pacotes usam somente o campo `exports`; ciclos são proibidos.'
  ].join('\n');
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
    const boundary = BOUNDARIES[source];
    if (boundary && !boundary.internal.includes(target))
      violations.push({
        path,
        message: boundary.internal.length
          ? `${source} must not depend on ${target}`
          : `${source} must not depend on another internal package`
      });
  };

  for (const file of files) {
    const path = normalize(file.path);
    if (!/^packages\/[^/]+\/package\.json$/.test(path)) continue;
    const source = packageDirectory(path)!;
    const manifest = JSON.parse(file.content) as Record<string, Record<string, string>>;
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      for (const dependency of Object.keys(manifest[field] ?? {})) {
        if (!dependency.startsWith('@noduct/') && !allowedExternal(source, path, dependency))
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
      if (source && !/\.test\.[cm]?[jt]sx?$/.test(path) &&
          !specifier.startsWith('.') && !specifier.startsWith('node:') &&
          !specifier.startsWith('@noduct/') &&
          !allowedExternal(source, path, externalName(specifier)))
        violations.push({ path, message: `${source} must not import ${specifier}` });
      const namedPackage = packageName(specifier);
      if (namedPackage && names.has(namedPackage)) {
        const target = names.get(namedPackage)!;
        const publicPath = specifier.slice(namedPackage.length);
        const exportKey = publicPath ? `.${publicPath}` : '.';
        if (!manifests.get(target)!.exports.has(exportKey)) {
          violations.push({ path, message: `Import ${specifier} is not a public package export` });
        }
        if (path.startsWith('src/') && (HUB.forbidden as readonly string[]).includes(target) &&
            !hubMayImport(path, specifier)) {
          violations.push({ path, message: `Hub must not import ${specifier}` });
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
      if (path.startsWith('src/') && target && (HUB.forbidden as readonly string[]).includes(target)) {
        violations.push({ path, message: `Hub must not import ${target}` });
      }
    }
  }

  const cycle = findCycle(edges);
  if (cycle)
    violations.push({ path: 'packages/', message: `Dependency cycle: ${cycle.join(' -> ')}` });
  return violations;
}

const ARCHITECTURE_DOC = 'docs/architecture/README.md';
const DOC_START = '<!-- generated:boundaries:start -->';
const DOC_END = '<!-- generated:boundaries:end -->';

/** Devolve o documento com a seção gerada atualizada, ou undefined se faltarem os marcadores. */
export function syncArchitectureDoc(source: string): string | undefined {
  const start = source.indexOf(DOC_START);
  const end = source.indexOf(DOC_END);
  if (start < 0 || end < start) return undefined;
  return `${source.slice(0, start + DOC_START.length)}\n${boundariesMarkdown()}\n${source.slice(end)}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { execFileSync } = await import('node:child_process');
  const { existsSync, writeFileSync } = await import('node:fs');
  const docPath = resolve(ROOT, ARCHITECTURE_DOC);
  const docSource = existsSync(docPath) ? readFileSync(docPath, 'utf8').replace(/\r\n/g, '\n') : '';
  const synced = syncArchitectureDoc(docSource);
  if (process.argv.includes('--write') && synced) writeFileSync(docPath, synced);
  else if (!synced || synced !== docSource) {
    console.error(
      `[architecture-doc] ${ARCHITECTURE_DOC}:1 — O mapa de pacotes divergiu de guardrails.config.ts. Rode npx tsx scripts/validate-architecture.ts --write e revise o diff. Ver docs/guardrails.md#architecture-doc`
    );
    process.exitCode = 1;
  }
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(
      (path) =>
        path &&
        (SOURCE_EXTENSIONS.test(path) || /packages\/[^/]+\/package\.json$/.test(path)) &&
        existsSync(resolve(ROOT, path))
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
  else if (!process.exitCode) console.log(`Architecture validation passed (${files.length} files).`);
}
