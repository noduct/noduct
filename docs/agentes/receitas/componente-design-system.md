# Adicionar componente ao design system

## Pré-condições

A API pública e a responsabilidade compartilhada estão descritas na issue.

## Arquivos afetados

`packages/design-system/src/`, CSS Module, testes, versão e changelog.

## Referência canônica

[DropZone](../../../packages/design-system/src/components/DropZone.astro) e [Icon](../../../packages/design-system/src/icons/Icon.astro).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

Cor literal, SVG isolado, estado via classe gerada, alvo menor que 44 px.
