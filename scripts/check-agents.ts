import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deployedTools } from './pages-manifest.ts';
import { checkNames } from './cli/check.ts';
export const GUARDRAIL_IDS = ['agent-scope', 'agent-budget', 'agent-pointer', 'agent-link', 'agent-command', 'agent-anchor', 'agent-skill', 'agent-doc-index', 'no-emdash'];
/** A fonte das skills do projeto é .agents/skills; as demais pastas recebem cópias idênticas. */
const SKILL_SOURCE = '.agents/skills/';
const SKILL_MIRRORS = ['.claude/skills/', '.github/skills/', '.gemini/skills/'];
const PROJECT_SKILL = /^\.agents\/skills\/(noduct-[a-z0-9-]+)\/SKILL\.md$/;
/** Documentos cujos links e comandos são verificados; skills geradas pelo OpenSpec ficam fora. */
const isCheckedDocument = (name: string): boolean =>
  (name.endsWith('.md') &&
    (name.endsWith('AGENTS.md') ||
      name.startsWith('docs/') ||
      name.startsWith('openspec/') ||
      name.startsWith('.github/') ||
      PROJECT_SKILL.test(name) ||
      /^packages\/[^/]+\/README\.md$/.test(name) ||
      ['README.md', 'CONTRIBUTING.md', 'DEVELOPMENT.md'].includes(name))) ||
  /^(?:packages\/[^/]+\/)?\.github\/workflows\/[^/]+\.ya?ml$/.test(name);

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const format = (path: string): string => relative(root, path).replaceAll('\\', '/') || 'AGENTS.md';
const read = (path: string): string => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const lines = (source: string): number => source.replace(/\n$/, '').split('\n').length;
const fail = (id: string, path: string, line: number, reason: string, fix: string): string =>
  `[${id}] ${format(path)}:${line} — ${reason} ${fix} Ver docs/guardrails.md#${id}`;
const listFiles = (): string[] => execFileSync(
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
const copilotText =
  'As regras deste repositório estão em [AGENTS.md](../AGENTS.md) e [docs/guardrails.md](../docs/guardrails.md). Leia também o AGENTS.md da pasta em que trabalha.';
const COPY_FILE = /(?:^|\/)(?:i18n\.ts|messages\.ts|tool-info-messages\.ts|catalog\/[^/]+\.json)$/;
const EMDASH = /[\u2013\u2014]/;

export function emdashViolations(source: string): number[] {
  return source.split('\n').flatMap((line, index) => (EMDASH.test(line) ? [index + 1] : []));
}

export function localAgentViolations(source: string): string[] {
  const errors: string[] = [];
  if (!source.startsWith('Complementa [AGENTS.md](')) errors.push('agent-scope');
  if (lines(source) < 5 || lines(source) > 15) errors.push('agent-budget');
  if (/Leia o contrato raiz|Consulte os arquivos canônicos|Rode `npm run check` após|Registre a saída de `npm run verify`/.test(source))
    errors.push('agent-scope');
  return errors;
}

export function writeAgentPointers(): void {
  const files = listFiles();
  const fileSet = new Set(files);
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
  for (const source of files.filter((file) => PROJECT_SKILL.test(format(file)))) {
    const relativePath = format(source).slice(SKILL_SOURCE.length);
    for (const mirror of SKILL_MIRRORS) {
      const target = resolve(root, mirror, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, read(source));
    }
  }
}

/** Erros das skills do projeto: frontmatter, cópias idênticas e índice no AGENTS.md raiz. */
export function skillViolations(
  files: ReadonlyMap<string, string>,
  rootAgentsSource: string
): Array<{ id: string; path: string; reason: string; fix: string }> {
  const errors: Array<{ id: string; path: string; reason: string; fix: string }> = [];
  const sources = [...files.keys()].filter((name) => PROJECT_SKILL.test(name));
  for (const path of sources) {
    const name = PROJECT_SKILL.exec(path)![1]!;
    const source = files.get(path)!;
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? '';
    if (!new RegExp(`^name: ${name}$`, 'm').test(frontmatter) || !/^description: \S/m.test(frontmatter))
      errors.push({
        id: 'agent-skill',
        path,
        reason: 'Skill sem name igual à pasta ou sem description.',
        fix: 'Declare name e description no frontmatter; a description diz quando usar a skill.'
      });
    if (!rootAgentsSource.includes(`(.agents/skills/${name}/SKILL.md)`))
      errors.push({
        id: 'agent-skill',
        path,
        reason: 'Skill fora do índice do AGENTS.md; agentes nem sempre a invocam sozinhos.',
        fix: 'Liste a skill na tabela de skills do AGENTS.md raiz.'
      });
    for (const mirror of SKILL_MIRRORS) {
      const copy = mirror + path.slice(SKILL_SOURCE.length);
      if (files.get(copy) !== source)
        errors.push({
          id: 'agent-skill',
          path: copy,
          reason: 'Cópia de skill ausente ou divergente da fonte.',
          fix: 'Edite só .agents/skills/ e rode npx tsx scripts/check-agents.ts --write.'
        });
    }
  }
  for (const name of files.keys()) {
    const mirror = SKILL_MIRRORS.find((prefix) => name.startsWith(prefix));
    if (!mirror || !/\/noduct-[a-z0-9-]+\//.test(name)) continue;
    if (!files.has(SKILL_SOURCE + name.slice(mirror.length)))
      errors.push({
        id: 'agent-skill',
        path: name,
        reason: 'Cópia de skill sem fonte correspondente.',
        fix: 'Remova a cópia ou crie a skill em .agents/skills/.'
      });
  }
  return errors;
}

/**
 * Documentos de docs/ inalcançáveis a partir de docs/README.md. O índice segue sub-índices
 * (`README.md` de cada pasta), de modo que docs/adr/README.md pode listar os ADRs.
 */
export function unindexedDocuments(
  documents: readonly string[],
  readSource: (name: string) => string
): string[] {
  const linked = new Set<string>(['docs/README.md']);
  const queue = ['docs/README.md'];
  while (queue.length) {
    const index = queue.shift()!;
    for (const match of readSource(index).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      if (/^[a-z]+:/.test(match[1]!)) continue;
      const target = posix.normalize(posix.join(posix.dirname(index), decodeURI(match[1]!)));
      if (linked.has(target)) continue;
      linked.add(target);
      if (target.startsWith('docs/') && target.endsWith('/README.md')) queue.push(target);
    }
  }
  return documents.filter(
    (name) => name.startsWith('docs/') && name.endsWith('.md') && !linked.has(name)
  );
}

export function checkAgents(): string[] {
  const files = listFiles();
  const fileSet = new Set(files);
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
          'Crie um AGENTS.md de 5 a 15 linhas que complemente a raiz.'
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
      if (localAgentViolations(source).includes('agent-scope'))
        errors.push(
          fail(
            'agent-scope',
            path,
            1,
            'Regras locais devem complementar a raiz.',
            'Comece com um link para o AGENTS.md da raiz.'
          )
        );
      if (localAgentViolations(source).includes('agent-budget'))
        errors.push(
          fail(
            'agent-budget',
            path,
            1,
            'Instruções locais devem ter 5 a 15 linhas.',
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
    if (name.endsWith('GEMINI.md') && read(path) !== '@AGENTS.md\n')
      errors.push(
        fail('agent-pointer', path, 1, 'O fallback Gemini divergiu.', 'Use somente @AGENTS.md ou remova GEMINI.md.')
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
  const docs = files.filter((path) => isCheckedDocument(format(path)));
  const contents = new Map(
    files
      .filter((path) => {
        const name = format(path);
        return PROJECT_SKILL.test(name) || SKILL_MIRRORS.some((mirror) => name.startsWith(mirror));
      })
      .map((path) => [format(path), read(path)] as const)
  );
  for (const error of skillViolations(contents, read(rootAgents)))
    errors.push(fail(error.id, resolve(root, error.path), 1, error.reason, error.fix));
  const readIndex = (name: string): string => {
    const path = resolve(root, name);
    return fileSet.has(path) ? read(path) : '';
  };
  for (const name of unindexedDocuments(files.map(format), readIndex))
    errors.push(
      fail(
        'agent-doc-index',
        resolve(root, name),
        1,
        'Documento sem entrada no índice; agentes e pessoas não o encontram.',
        'Acrescente uma linha em docs/README.md ou remova o documento.'
      )
    );
  for (const path of files) {
    const name = format(path);
    if (!COPY_FILE.test(name)) continue;
    for (const line of emdashViolations(read(path)))
      errors.push(
        fail(
          'no-emdash',
          path,
          line,
          'Travessão ou traço médio em texto visível.',
          'Troque por ponto, vírgula, dois-pontos ou hífen ASCII.'
        )
      );
  }
  for (const path of docs) {
    const source = read(path);
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1]?.split('#')[0] ?? '';
      if (!target || /^(?:https?|mailto):/.test(target) || /[<>]/.test(target)) continue;
      if (/^(?:file|vscode):/.test(target)) {
        errors.push(
          fail('agent-link', path, source.slice(0, match.index).split('\n').length,
            `Link com esquema local: ${target}.`,
            'Use um caminho relativo ao documento.')
        );
        continue;
      }
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
    for (const match of source.matchAll(/npm run check -- ([a-z][a-z0-9-]*)/g)) {
      if (!checkNames.includes(match[1]!))
        errors.push(
          fail('agent-command', path, source.slice(0, match.index).split('\n').length,
            `O subcomando check -- ${match[1]} não existe.`,
            'Use um verificador listado em scripts/cli/check.ts.')
        );
    }
    for (const match of source.matchAll(/npx tsx ([a-z0-9./-]+\.(?:ts|mjs))/g)) {
      if (!existsSync(resolve(root, match[1]!)))
        errors.push(
          fail('agent-command', path, source.slice(0, match.index).split('\n').length,
            `O alvo npx tsx ${match[1]} não existe.`,
            'Corrija o caminho do script citado.')
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
    const ruleFiles = [
      'scripts/check-agents.ts', 'scripts/check-scripts.ts',
      'scripts/check-guardrail-ratchet.ts', 'scripts/validate-architecture.ts',
      'scripts/validate-ui.ts', 'scripts/eslint-formatter.mjs',
      'scripts/stylelint-formatter.mjs', 'tests/e2e/shell-parity.spec.ts'
    ];
    const ids = new Set<string>();
    for (const ruleFile of ruleFiles) {
      const declaration = /export const GUARDRAIL_IDS = \[([^\]]+)\]/.exec(read(resolve(root, ruleFile)));
      if (!declaration) {
        errors.push(fail('agent-anchor', resolve(root, ruleFile), 1, 'Regra sem declaração de IDs.', 'Exporte GUARDRAIL_IDS.'));
        continue;
      }
      for (const match of declaration[1]!.matchAll(/'([a-z][a-z0-9-]+)'/g)) ids.add(match[1]!);
    }
    for (const id of ids) {
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
