# Escrever e2e com axe e paridade

## Pré-condições

Existe cenário observável e perfis, idiomas e temas relevantes definidos.

## Arquivos afetados

`tests/e2e/`, fixtures e snapshots necessários.

## Referência canônica

[paridade](../../../tests/e2e/shell-parity.spec.ts) e [axe](../../../tests/e2e/audit.spec.ts).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run test:e2e`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

`waitForTimeout`, seletor frágil, `.skip`, asserção afrouxada ou teste só em um tema.
