# Adicionar operação ao pdf-core

## Pré-condições

O contrato define entrada, saída, limites e códigos de erro.

## Arquivos afetados

`packages/pdf-core/src/`, exports públicos, unitários e documentação de contrato.

## Referência canônica

[contratos PDF](../../../docs/architecture/pdf-core-contracts.md) e [unitário](../../../tests/unit/pdf-core.test.ts).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

DOM/Astro no core, import estático de motor pesado, mensagem traduzida no domínio.
