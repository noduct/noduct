# Adicionar ícone à allowlist

## Pré-condições

A necessidade de um novo ícone foi aprovada e não há nome existente adequado.

## Arquivos afetados

`packages/design-system/src/icons/registry.ts`, uso em componente e testes.

## Referência canônica

[registry](../../../packages/design-system/src/icons/registry.ts) e [Icon](../../../packages/design-system/src/icons/Icon.astro).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

Emoji, glifo ou `<svg>` local; ampliar a allowlist sem label `guardrail-change` e justificativa.
