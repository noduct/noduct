import { relative } from 'node:path';

const details = {
  'noduct/require-app-shell': [
    'require-app-shell',
    'Páginas sem shell perdem navegação e SEO compartilhados.',
    'Componha AppShell; veja packages/tool-template/src/pages/index.astro.'
  ],
  'noduct/no-hardcoded-text': [
    'no-hardcoded-text',
    'Texto fixo deixa idiomas incompletos.',
    'Use mensagens en, pt-BR e es; veja src/i18n/messages.ts.'
  ],
  'no-restricted-syntax': [
    'no-raw-svg',
    'SVG solto diverge do sistema de ícones.',
    'Use Icon; veja packages/design-system/src/icons/Icon.astro.'
  ],
  'no-restricted-imports': [
    'architecture-boundary',
    'Import privado ou shell paralelo quebra a arquitetura.',
    'Use export público e AppShell; veja docs/adr/0005-unified-shell-topology-guardrails.md.'
  ],
  'no-restricted-globals': [
    'architecture-boundary',
    'Pacotes de domínio não dependem de DOM.',
    'Remova o acesso a window/document/localStorage.'
  ]
};

export default function format(results) {
  return results
    .flatMap((result) =>
      result.messages.map((message) => {
        const [id, why, fix] = details[message.ruleId] ?? [
          'lint-rule',
          'A regra de lint protege a qualidade do código.',
          'Corrija o código na linha indicada sem desativar a regra.'
        ];
        const path = relative(process.cwd(), result.filePath).replaceAll('\\', '/');
        return `[${id}] ${path}:${message.line ?? 1} — ${message.message} ${why} ${fix} Ver docs/guardrails.md#${id}`;
      })
    )
    .join('\n');
}
