# Adicionar rota ao hub

## Pré-condições

A rota é indexável e o segmento não colide com ferramenta ou locale.

## Arquivos afetados

`src/pages/`, `tool-runtime` se houver segmento reservado, SEO e testes.

## Referência canônica

[home](../../../src/pages/index.astro) e [topology](../../../packages/tool-runtime/src/topology.ts).

## Passos e validação

1. Leia [AGENTS.md](../../../AGENTS.md) e [guardrails](../../guardrails.md).
2. Faça um plano curto e implemente a menor mudança verificável.
3. Execute `npm run check`; `npm run verify`.
4. Registre o resultado e a justificativa no PR.

## Erros comuns

URL escrita à mão, H1 ausente, metadata sem canonical, segmento não reservado.
