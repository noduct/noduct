import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployedTools } from './pages-manifest.ts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const format = (path: string): string => relative(root, path).replaceAll('\\', '/') || 'AGENTS.md';
const read = (path: string): string => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const lines = (source: string): number => source.replace(/\n$/, '').split('\n').length;
const fail = (id: string, path: string, line: number, reason: string, fix: string): string =>
  `[${id}] ${format(path)}:${line} — ${reason} ${fix} Ver docs/guardrails.md#${id}`;
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    cwd: root,
    encoding: 'utf8'
  }
)
  .split('\0')
  .filter(Boolean)
  .map((path) => resolve(root, path))
  .filter(existsSync);
const fileSet = new Set(files);
const copilotText =
  'As regras deste repositório estão em [AGENTS.md](../AGENTS.md) e [docs/guardrails.md](../docs/guardrails.md). Leia também o AGENTS.md da pasta em que trabalha.';

export function writeAgentPointers(): void {
  for (const path of files.filter(
    (file) => file.endsWith('/AGENTS.md') || file.endsWith('\\AGENTS.md')
  )) {
    const pointer = resolve(dirname(path), 'CLAUDE.md');
    writeFileSync(pointer, '@AGENTS.md\n');
    fileSet.add(pointer);
    if (!files.includes(pointer)) files.push(pointer);
  }
  const copilot = resolve(root, '.github/copilot-instructions.md');
  writeFileSync(copilot, copilotText + '\n');
  fileSet.add(copilot);
  if (!files.includes(copilot)) files.push(copilot);
}

export function checkAgents(): string[] {
  const errors: string[] = [];
  const agents = files.filter(
    (path) => path.endsWith('/AGENTS.md') || path.endsWith('\\AGENTS.md')
  );
  const rootAgents = resolve(root, 'AGENTS.md');
  const required = [
    'packages/tool-runtime',
    'packages/pdf-core',
    'packages/workspace-core',
    'packages/design-system',
    'packages/tool-template',
    ...deployedTools().map((tool) => relative(root, tool.packageDir)),
    'src',
    'tests',
    'scripts'
  ];
  for (const directory of required) {
    const path = resolve(root, directory, 'AGENTS.md');
    if (!fileSet.has(path))
      errors.push(
        fail(
          'agent-scope',
          path,
          1,
          'A área precisa de restrições locais.',
          'Crie um AGENTS.md de 20 a 60 linhas que complemente a raiz.'
        )
      );
  }
  if (!fileSet.has(rootAgents))
    return [
      fail('agent-scope', rootAgents, 1, 'Falta a fonte única das regras.', 'Restaure AGENTS.md.')
    ];
  if (lines(read(rootAgents)) > 200)
    errors.push(
      fail(
        'agent-budget',
        rootAgents,
        201,
        'Instruções longas são truncadas ou ignoradas.',
        'Resuma a raiz a no máximo 200 linhas e mova detalhes para docs/.'
      )
    );
  for (const path of agents) {
    const source = read(path);
    if (path !== rootAgents) {
      if (!source.startsWith('Complementa o AGENTS.md da raiz'))
        errors.push(
          fail(
            'agent-scope',
            path,
            1,
            'Regras locais devem complementar a raiz.',
            'Comece com “Complementa o AGENTS.md da raiz”.'
          )
        );
      if (lines(source) < 20 || lines(source) > 60)
        errors.push(
          fail(
            'agent-budget',
            path,
            1,
            'Instruções locais devem ter 20 a 60 linhas.',
            'Resuma ou complete as restrições locais.'
          )
        );
      if (
        !path.startsWith(resolve(root, 'packages') + sep) &&
        !['src', 'tests', 'scripts'].includes(format(dirname(path)))
      )
        errors.push(
          fail(
            'agent-scope',
            path,
            1,
            'Há um escopo local inesperado.',
            'Revise a hierarquia e a documentação.'
          )
        );
    }
    const pointer = resolve(dirname(path), 'CLAUDE.md');
    if (!fileSet.has(pointer) || read(pointer) !== '@AGENTS.md\n')
      errors.push(
        fail(
          'agent-pointer',
          pointer,
          1,
          'Claude precisa importar as mesmas regras.',
          'Deixe o arquivo com a única linha @AGENTS.md.'
        )
      );
    let parent = dirname(path);
    let bytes = Buffer.byteLength(source);
    while (parent.startsWith(root) && parent !== root) {
      parent = dirname(parent);
      const ancestor = resolve(parent, 'AGENTS.md');
      if (fileSet.has(ancestor)) bytes += Buffer.byteLength(read(ancestor));
    }
    if (bytes > 24 * 1024)
      errors.push(
        fail(
          'agent-budget',
          path,
          1,
          'A cadeia excede a folga de 24 KiB para Codex.',
          'Reduza AGENTS.md e mova detalhes para docs/.'
        )
      );
  }
  for (const path of files) {
    const name = format(path);
    if (name.endsWith('AGENTS.override.md'))
      errors.push(
        fail(
          'agent-pointer',
          path,
          1,
          'Override substitui regras da pasta.',
          'Remova AGENTS.override.md.'
        )
      );
    if (name.endsWith('GEMINI.md'))
      errors.push(
        fail('agent-pointer', path, 1, 'Gemini já lê AGENTS.md via settings.', 'Remova GEMINI.md.')
      );
    if (name.endsWith('CLAUDE.md') && !fileSet.has(resolve(dirname(path), 'AGENTS.md')))
      errors.push(
        fail(
          'agent-pointer',
          path,
          1,
          'Ponteiro sem regras correspondentes.',
          'Crie AGENTS.md ou remova o ponteiro.'
        )
      );
    if (
      name.startsWith('.cursor/rules/') &&
      read(path).trim() !== 'As regras deste repositório estão em AGENTS.md e docs/guardrails.md.'
    )
      errors.push(
        fail(
          'agent-pointer',
          path,
          1,
          'Regras paralelas divergem.',
          'Use apenas o ponteiro canônico.'
        )
      );
  }
  const gemini = resolve(root, '.gemini/settings.json');
  try {
    const config = JSON.parse(read(gemini)) as { context?: { fileName?: unknown } };
    if (
      !Array.isArray(config.context?.fileName) ||
      config.context.fileName.length !== 1 ||
      config.context.fileName[0] !== 'AGENTS.md'
    )
      throw new Error('context.fileName');
  } catch {
    errors.push(
      fail(
        'agent-pointer',
        gemini,
        1,
        'Gemini não está configurado para AGENTS.md.',
        'Defina context.fileName como ["AGENTS.md"].'
      )
    );
  }
  const copilot = resolve(root, '.github/copilot-instructions.md');
  if (!fileSet.has(copilot) || read(copilot).trimEnd() !== copilotText)
    errors.push(
      fail(
        'agent-pointer',
        copilot,
        1,
        'O ponteiro Copilot divergiu.',
        'Use somente o texto canônico que aponta para AGENTS.md e docs/guardrails.md.'
      )
    );
  const packageJson = JSON.parse(read(resolve(root, 'package.json'))) as {
    scripts?: Record<string, string>;
  };
  const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
  const docs = files.filter((path) => {
    const name = format(path);
    return (
      name.endsWith('AGENTS.md') ||
      name === 'docs/guardrails.md' ||
      (name.startsWith('docs/agentes/receitas/') && name.endsWith('.md'))
    );
  });
  for (const path of docs) {
    const source = read(path);
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1]?.split('#')[0] ?? '';
      if (!target || /^https?:\/\//.test(target)) continue;
      const destination = resolve(dirname(path), decodeURI(target));
      if (!existsSync(destination))
        errors.push(
          fail(
            'agent-link',
            path,
            source.slice(0, match.index).split('\n').length,
            `Link local quebrado: ${target}.`,
            'Corrija o caminho ou crie o arquivo referido.'
          )
        );
    }
    for (const match of source.matchAll(/npm run ([a-z][a-z0-9:-]*)/g)) {
      if (!scripts.has(match[1]!))
        errors.push(
          fail(
            'agent-command',
            path,
            source.slice(0, match.index).split('\n').length,
            `O script ${match[1]} não existe no manifesto raiz.`,
            'Use um comando da lista fechada em package.json.'
          )
        );
    }
  }
  const guide = resolve(root, 'docs/guardrails.md');
  if (!fileSet.has(guide))
    errors.push(
      fail('agent-anchor', guide, 1, 'Falta o mapa de correção.', 'Crie docs/guardrails.md.')
    );
  else {
    const source = read(guide);
    for (const id of [
      'agent-scope',
      'agent-budget',
      'agent-pointer',
      'agent-link',
      'agent-command',
      'agent-anchor',
      'no-raw-svg',
      'no-hardcoded-text',
      'require-app-shell',
      'token-value',
      'lint-rule',
      'ui-contract',
      'architecture-boundary',
      'ratchet',
      'script-contract',
      'shell-parity'
    ]) {
      if (!source.includes(`id="${id}"`))
        errors.push(
          fail(
            'agent-anchor',
            guide,
            1,
            `Falta a âncora ${id}.`,
            `Adicione <a id="${id}"></a> à matriz.`
          )
        );
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--write')) writeAgentPointers();
  const errors = checkAgents();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Agent contract passed.');
}
