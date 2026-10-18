import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_FILE = /\.(?:ts|tsx|js|mjs|astro|css)$/;
const CONTROL_FILES = /^(?:eslint\.config\.js|stylelint\.config\.mjs|eslint-rules\/)/;
const CONFIG_PATH = 'guardrails.config.ts';
const ICON_PATH = 'packages/design-system/src/icons/registry.ts';
const TOPOLOGY_PATH = 'packages/tool-runtime/src/topology.ts';

export interface RatchetSnapshot {
  readonly files: ReadonlyMap<string, string>;
}

export interface RatchetResult {
  readonly violations: readonly string[];
  readonly deltas: ReadonlyMap<string, number>;
}

function propertyName(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

function objectLiteral(
  source: string,
  variableName: string
): ts.ObjectLiteralExpression | undefined {
  const ast = ts.createSourceFile(variableName + '.ts', source, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== variableName) continue;
      let initializer = declaration.initializer;
      while (
        initializer &&
        (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer))
      ) {
        initializer = initializer.expression;
      }
      if (initializer && ts.isObjectLiteralExpression(initializer)) return initializer;
    }
  }
  return undefined;
}

function arraySizes(source: string): Map<string, number> {
  const sizes = new Map<string, number>();
  const config = objectLiteral(source, 'guardrails');
  if (!config) return sizes;
  for (const property of config.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = propertyName(property.name);
    if (name && ts.isArrayLiteralExpression(property.initializer)) {
      sizes.set(`allowlist:${name}`, property.initializer.elements.length);
    }
  }
  return sizes;
}

function iconCount(source: string): number {
  return objectLiteral(source, 'iconRegistry')?.properties.length ?? 0;
}

function reservedCount(source: string): number {
  const ast = ts.createSourceFile(TOPOLOGY_PATH, source, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'RESERVED_HUB_SEGMENTS')
        continue;
      let value = declaration.initializer;
      while (value && ts.isAsExpression(value)) value = value.expression;
      if (value && ts.isNewExpression(value) && value.expression.getText(ast) === 'Set') {
        value = value.arguments?.[0];
      }
      if (value && ts.isArrayLiteralExpression(value)) return value.elements.length;
    }
  }
  return 0;
}

function actualComments(path: string, source: string): string[] {
  const scan = (code: string): string[] => {
    const scanner = ts.createScanner(
      ts.ScriptTarget.Latest,
      false,
      ts.LanguageVariant.Standard,
      code
    );
    const comments: string[] = [];
    for (
      let token = scanner.scan();
      token !== ts.SyntaxKind.EndOfFileToken;
      token = scanner.scan()
    ) {
      if (
        token === ts.SyntaxKind.SingleLineCommentTrivia ||
        token === ts.SyntaxKind.MultiLineCommentTrivia
      )
        comments.push(scanner.getTokenText());
    }
    return comments;
  };
  if (path.endsWith('.css')) return source.match(/\/\*[\s\S]*?\*\//g) ?? [];
  if (path.endsWith('.astro')) {
    const blockComments = source.match(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g) ?? [];
    const scripts = [
      /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '',
      ...[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
        (match) => match[1] ?? ''
      )
    ];
    return [
      ...blockComments,
      ...scripts.flatMap((script) => scan(script).filter((comment) => comment.startsWith('//')))
    ];
  }
  return scan(source);
}

export function ratchetCounts(snapshot: RatchetSnapshot): Map<string, number> {
  const counts = new Map<string, number>();
  const suppressionNames = [
    ['eslint-disable', ['eslint', 'disable'].join('-')],
    ['stylelint-disable', ['stylelint', 'disable'].join('-')],
    ['@ts-ignore', ['@ts', 'ignore'].join('-')],
    ['@ts-expect-error', ['@ts', 'expect', 'error'].join('-')]
  ] as const;
  for (const [path, source] of snapshot.files) {
    if (!SOURCE_FILE.test(path)) continue;
    const comments = actualComments(path, source);
    for (const comment of comments) {
      for (const [name, marker] of suppressionNames) {
        const count = comment.split(marker).length - 1;
        counts.set(name, (counts.get(name) ?? 0) + count);
      }
    }
    if (path.endsWith('.css')) continue;
    const code = path.endsWith('.astro')
      ? [
          /^---\s*\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '',
          ...[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
            (match) => match[1] ?? ''
          )
        ].join('\n')
      : source;
    const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const property = node.expression;
        if (
          ts.isIdentifier(property.expression) &&
          ['test', 'it', 'describe'].includes(property.expression.text)
        ) {
          if (property.name.text === 'skip' || property.name.text === 'fixme') {
            const name = `test.${property.name.text}`;
            counts.set(name, (counts.get(name) ?? 0) + 1);
          }
        }
      }
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'only') {
        counts.set('.only', (counts.get('.only') ?? 0) + 1);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  for (const [name, count] of arraySizes(snapshot.files.get(CONFIG_PATH) ?? ''))
    counts.set(name, count);
  counts.set('allowlist:icons', iconCount(snapshot.files.get(ICON_PATH) ?? ''));
  counts.set(
    'allowlist:reservedHubSegments',
    reservedCount(snapshot.files.get(TOPOLOGY_PATH) ?? '')
  );
  return counts;
}

export function evaluateRatchet(
  base: RatchetSnapshot,
  current: RatchetSnapshot,
  hasGuardrailChangeLabel: boolean
): RatchetResult {
  const before = ratchetCounts(base);
  const after = ratchetCounts(current);
  const deltas = new Map<string, number>();
  const violations: string[] = [];
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    const delta = (after.get(name) ?? 0) - (before.get(name) ?? 0);
    deltas.set(name, delta);
    if (delta > 0 && !hasGuardrailChangeLabel) {
      violations.push(`${name} increased by ${delta}; PR needs guardrail-change label`);
    }
  }
  if (!hasGuardrailChangeLabel) {
    for (const path of new Set([...base.files.keys(), ...current.files.keys()])) {
      if (
        CONTROL_FILES.test(path) &&
        base.files.get(path)?.replace(/\r\n/g, '\n') !==
          current.files.get(path)?.replace(/\r\n/g, '\n')
      ) {
        violations.push(`${path} changed; PR needs guardrail-change label`);
      }
    }
  }
  return { violations, deltas };
}

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function snapshotAt(ref: string): RatchetSnapshot {
  const paths = git(['ls-tree', '-r', '--name-only', '-z', ref]).split('\0').filter(Boolean);
  const files = new Map<string, string>();
  for (const path of paths) {
    if (!SOURCE_FILE.test(path) && path !== CONFIG_PATH) continue;
    files.set(path, git(['show', `${ref}:${path}`]));
  }
  return { files };
}

function workingSnapshot(): RatchetSnapshot {
  const paths = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean);
  const files = new Map<string, string>();
  for (const path of paths) {
    if ((!SOURCE_FILE.test(path) && path !== CONFIG_PATH) || !existsSync(resolve(ROOT, path)))
      continue;
    files.set(path, readFileSync(resolve(ROOT, path), 'utf8'));
  }
  return { files };
}

function prHasLabel(): boolean {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return false;
  const event = JSON.parse(readFileSync(eventPath, 'utf8')) as {
    pull_request?: { labels?: { name?: string }[] };
  };
  return event.pull_request?.labels?.some((label) => label.name === 'guardrail-change') ?? false;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--base');
  const baseRef = index >= 0 ? process.argv[index + 1] : undefined;
  if (!baseRef) {
    console.error('Usage: tsx scripts/check-guardrail-ratchet.ts --base <base-commit>');
    process.exitCode = 2;
  } else {
    try {
      const label = prHasLabel();
      const result = evaluateRatchet(snapshotAt(baseRef), workingSnapshot(), label);
      for (const violation of result.violations) console.error(violation);
      if (result.violations.length > 0) process.exitCode = 1;
      else console.log(`Guardrail ratchet passed (guardrail-change label: ${label}).`);
    } catch (error) {
      console.error(`Guardrail ratchet could not compare with ${baseRef}: ${String(error)}`);
      process.exitCode = 2;
    }
  }
}
