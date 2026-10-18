# Adicionar ou alterar token

## Pré-condições

O valor serve a mais de um componente e o contraste AA foi medido nos dois temas.

## Arquivos afetados

`packages/design-system/src/tokens.css`, tema, documentação e teste de contraste.

## Referência canônica

[tokens](../../../packages/design-system/src/tokens.css) e [teste](../../../tests/unit/theme-colors.test.ts).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

Literal CSS em consumidor; token sem equivalente no tema escuro; mudança global sem aprovação.
