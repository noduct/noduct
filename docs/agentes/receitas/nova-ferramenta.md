# Criar ferramenta

## Pré-condições

A issue define slug, categoria, idiomas e critérios do Contrato #39.

## Arquivos afetados

`packages/<slug>/`, catálogo em `src/data/`, mensagens em `src/i18n/catalog/` e testes.

## Referência canônica

[merge-pdf](../../../packages/merge-pdf/src/pages/index.astro) e [template](../../../packages/tool-template/src/pages/index.astro).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run new:tool -- <slug> --category <category>`; complete os TODO(i18n); `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

Editar a lista de ferramentas à mão no CLI; deixar placeholder; criar shell ou URL próprios.
