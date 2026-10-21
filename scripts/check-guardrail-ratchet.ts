import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { guardrails } from '../guardrails.config';
export const GUARDRAIL_IDS = ['ratchet'];

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|astro|css)$/;
const CONTROL_FILES = /^(?:guardrails\.config\.ts|(?:[^/]+\/)*eslint\.config\.[^/]+|(?:[^/]+\/)*stylelint\.config\.[^/]+|(?:[^/]+\/)*playwright\.[^/]*config\.[^/]+|(?:[^/]+\/)*vitest\.config\.[^/]+|(?:[^/]+\/)*astro\.config\.[^/]+|(?:[^/]+\/)*tsconfig(?:\.[^/]*)?\.json|package\.json|\.github\/(?:workflows\/[^/]+\.ya?ml|CODEOWNERS)|eslint-rules\/.*|scripts\/(?:guardrail-skip-baseline\.json|(?:check-guardrail-ratchet|check-scripts|check-agents|validate-ui|validate-architecture|eslint-formatter|stylelint-formatter|cli\/(?:check|verify|ratchet-base))\.[^/]+)|tests\/e2e\/shell-parity\.spec\.ts|packages\/design-system\/src\/icons\/registry\.ts)$/;
const CONFIG_PATH = 'guardrails.config.ts';
const ICON_PATH = 'packages/design-system/src/icons/registry.ts';
const TOPOLOGY_PATH = 'packages/tool-runtime/src/topology.ts';
function isControlFile(path: string): boolean {
  return CONTROL_FILES.test(path) || guardrails.controlFiles.some((entry) =>
    entry.endsWith('/') ? path.startsWith(entry) : path === entry
  );
}

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
    ['@ts-expect-error', ['@ts', 'expect', 'error'].join('-')],
    ['@ts-nocheck', ['@ts', 'nocheck'].join('-')]
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
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isIdentifier(callee) && /^(?:x(?:it|describe)|(?:it|test)\.todo)$/.test(callee.text))
          counts.set('test.skip', (counts.get('test.skip') ?? 0) + 1);
        if (ts.isPropertyAccessExpression(callee) && /^(?:skip|skipIf|fixme|todo|fail)$/.test(callee.name.text)) {
          const name = `test.${callee.name.text}`;
          counts.set(name, (counts.get(name) ?? 0) + 1);
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
    if (delta > 0 && !hasGuardrailChangeLabel)
      violations.push(`${name} increased by ${delta}; PR needs guardrail-change label`);
  }
  if (!hasGuardrailChangeLabel) {
    for (const [path, source] of current.files) {
      if (!SOURCE_FILE.test(path)) continue;
      const old = base.files.get(path) ?? '';
      const beforeComments = new Map<string, number>();
      for (const comment of actualComments(path, old))
        beforeComments.set(comment, (beforeComments.get(comment) ?? 0) + 1);
      for (const comment of actualComments(path, source)) {
        const remaining = beforeComments.get(comment) ?? 0;
        if (remaining > 0) { beforeComments.set(comment, remaining - 1); continue; }
        if (/(?:eslint-disable|stylelint-disable|@ts-(?:ignore|expect-error|nocheck))/u.test(comment))
          violations.push(`${path} added a suppression; PR needs guardrail-change label`);
      }
      const beforeSkips = ratchetCounts({ files: new Map([[path, old]]) });
      const afterSkips = ratchetCounts({ files: new Map([[path, source]]) });
      for (const [name, count] of afterSkips)
        if ((name.startsWith('test.') || name === '.only') && count > (beforeSkips.get(name) ?? 0))
          violations.push(`${path} added ${name}; PR needs guardrail-change label`);
    }
    for (const path of new Set([...base.files.keys(), ...current.files.keys()])) {
      if (
        isControlFile(path) &&
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
    if (!SOURCE_FILE.test(path) && !isControlFile(path)) continue;
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
    if ((!SOURCE_FILE.test(path) && !isControlFile(path)) || !existsSync(resolve(ROOT, path)))
      continue;
    files.set(path, readFileSync(resolve(ROOT, path), 'utf8'));
  }
  return { files };
}

export async function prHasLabel(
  eventPath = process.env.GITHUB_EVENT_PATH,
  repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN
): Promise<boolean> {
  if (!eventPath) return false;
  const event = JSON.parse(readFileSync(eventPath, 'utf8')) as {
    pull_request?: { number?: number; labels?: { name?: string }[] };
  };
  if (event.pull_request?.number && repository && token) {
    const response = await fetch(`https://api.github.com/repos/${repository}/issues/${event.pull_request.number}/labels`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`Cannot verify current PR labels (HTTP ${response.status}).`);
    const labels = await response.json() as { name?: string }[];
    return labels.some((label) => label.name === 'guardrail-change');
  }
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
      const label = await prHasLabel();
      const baseline = snapshotAt(baseRef);
      const current = workingSnapshot();
      const result = evaluateRatchet(baseline, current, label);
      for (const violation of result.violations) {
        const counter = /^([^ ]+) increased by/.exec(violation)?.[1];
        const path = counter === 'allowlist:icons'
          ? ICON_PATH
          : counter === 'allowlist:reservedHubSegments'
            ? TOPOLOGY_PATH
            : counter?.startsWith('allowlist:')
              ? CONFIG_PATH
              : counter
                ? [...current.files].find(([file, source]) => {
                    const before = ratchetCounts({ files: new Map([[file, baseline.files.get(file) ?? '']]) });
                    const after = ratchetCounts({ files: new Map([[file, source]]) });
                    return (after.get(counter) ?? 0) > (before.get(counter) ?? 0);
                  })?.[0] ?? CONFIG_PATH
                : violation.split(' ')[0] || CONFIG_PATH;
        const before = (baseline.files.get(path) ?? '').split('\n');
        const after = (current.files.get(path) ?? '').split('\n');
        const line = Math.max(1, after.findIndex((content, index) => content !== before[index]) + 1);
        console.error(
          `[ratchet] ${path}:${line} — ${violation}. Aumento silencioso de exceções oculta regressões. Corrija a causa ou obtenha label guardrail-change e justificativa aprovada pelo dono. Ver docs/guardrails.md#ratchet`
        );
      }
      if (result.violations.length > 0) process.exitCode = 1;
      else console.log(`Guardrail ratchet passed (guardrail-change label: ${label}).`);
    } catch (error) {
      console.error(`Guardrail ratchet could not compare with ${baseRef}: ${String(error)}`);
      process.exitCode = 2;
    }
  }
}
