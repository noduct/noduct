// Hook PostToolUse do Claude Code: roda o guardrail da área do arquivo editado e devolve o
// diagnóstico ao agente (exit 2). Os mesmos checks rodam em `npm run check` e no CI para
// qualquer agente; este hook só antecipa o feedback.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const bin = {
  eslint: resolve(root, 'node_modules/eslint/bin/eslint.js'),
  stylelint: resolve(root, 'node_modules/stylelint/bin/stylelint.mjs'),
  tsx: resolve(root, 'node_modules/tsx/dist/cli.mjs')
};

/** Comandos (node + argumentos) que validam o arquivo editado, por área. */
export function checksFor(path) {
  const checks = [];
  const source = /^(?:src|packages\/[^/]+\/src)\//.test(path);
  if (source && /\.(?:astro|ts|tsx|mjs)$/.test(path))
    checks.push([bin.eslint, '--config', 'eslint.config.js', '--max-warnings', '0', path]);
  if (source && /\.(?:css|astro)$/.test(path))
    checks.push([
      bin.stylelint, path, '--config', 'stylelint.config.mjs',
      '--custom-formatter', 'scripts/stylelint-formatter.mjs'
    ]);
  if (/^(?:src|packages|scripts)\/.*\.(?:astro|ts|mjs|css)$|^guardrails\.config\.ts$|package\.json$/.test(path))
    checks.push([bin.tsx, 'scripts/validate-architecture.ts']);
  if (
    /(?:^|\/)AGENTS\.md$|^docs\/.*\.md$|^openspec\/.*\.md$|^\.agents\/skills\/|^(?:README|CONTRIBUTING|DEVELOPMENT)\.md$/.test(path)
  )
    checks.push([bin.tsx, 'scripts/check-agents.ts']);
  return checks;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const filePath = JSON.parse(input || '{}').tool_input?.file_path;
  if (typeof filePath !== 'string') return;
  const path = relative(root, resolve(root, filePath)).replaceAll('\\', '/');
  if (path.startsWith('..') || !existsSync(resolve(root, path))) return;
  const failures = [];
  for (const [script, ...args] of checksFor(path)) {
    if (!existsSync(script)) continue;
    const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) failures.push(`${result.stdout}${result.stderr}`.trim());
  }
  if (failures.length) {
    process.stderr.write(
      `Guardrails falharam após editar ${path}. Corrija a causa seguindo a âncora de cada diagnóstico; não suprima regras.\n\n${failures.join('\n\n')}\n`
    );
    process.exit(2);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
