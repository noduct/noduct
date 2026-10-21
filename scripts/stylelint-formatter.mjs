import { relative } from 'node:path';
export const GUARDRAIL_IDS = ['token-value', 'css-rule'];

export default function format(results) {
  return results
    .flatMap((result) =>
      (result.warnings ?? []).map((warning) => {
        const path = relative(process.cwd(), result.source ?? '').replaceAll('\\', '/');
        const tokenRule = /strict-value|custom-properties|color-no-hex/.test(warning.rule ?? '');
        const id = tokenRule ? 'token-value' : 'css-rule';
        const repair = tokenRule
          ? 'Valor visual literal ou token desconhecido diverge dos temas. Use tokens.css e var(--token), com contraste AA.'
          : 'A regra CSS protege a consistência do estilo. Corrija a declaração indicada em stylelint.config.mjs.';
        return `[${id}] ${path}:${warning.line ?? 1} — ${warning.text} ${repair} Ver docs/guardrails.md#${id}`;
      })
    )
    .join('\n');
}
