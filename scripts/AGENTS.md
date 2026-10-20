Complementa [AGENTS.md](../AGENTS.md).

# Escopo local
- Comandos de produto são subcomandos de `noduct.ts`, implementados em `cli/*.ts` como funções testáveis.
- Não acrescente scripts ao `package.json` raiz; a lista é fechada.
- Descubra ferramentas por `pages-manifest.ts`, sem lista manual de slugs.
- Validadores exportam `GUARDRAIL_IDS` e imprimem `[id] arquivo:linha — motivo, correção e âncora`.
- Todo guardrail novo tem fixture violadora e âncora em `docs/guardrails.md`.
- `github/manage.mjs` é a única interface com o GitHub.
