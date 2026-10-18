import { relative } from 'node:path';

export default function format(results) {
  return results
    .flatMap((result) =>
      (result.warnings ?? []).map((warning) => {
        const path = relative(process.cwd(), result.source ?? '').replaceAll('\\', '/');
        return `[token-value] ${path}:${warning.line ?? 1} — ${warning.text} Valor visual literal ou token desconhecido diverge dos temas. Use packages/design-system/src/tokens.css e var(--token), com contraste AA. Ver docs/guardrails.md#token-value`;
      })
    )
    .join('\n');
}
