---
name: noduct-pdf-operation
description: Adiciona uma operação de domínio PDF ao pacote pdf-core do Noduct (mesclar, dividir, girar, extrair etc.) como função pura com erros por código, limites de recurso e cancelamento. Use quando uma ferramenta precisar processar PDF.
---

# Operação PDF

## Pré-condições

- Entrada, saída, limites e códigos de erro estão definidos na issue ou na mudança OpenSpec.

## Referência canônica

[contratos](../../../docs/architecture/pdf-core-contracts.md), [core.ts](../../../packages/pdf-core/src/core.ts), [errors.ts](../../../packages/pdf-core/src/errors.ts) e [modelo de ameaças](../../../docs/security/pdf-threat-model.md).

## Passos

1. Implemente a função em `packages/pdf-core/src/core.ts`, sem DOM, Astro ou armazenamento. Motor pesado só por `import()` dinâmico.
2. Falhas lançam uma subclasse de `PdfCoreError` (`errors.ts`) com `code` estável; nenhuma frase de interface.
3. Verifique `context.signal` e lance `OperationCancelledError` ao cancelar; respeite os limites do orçamento de recursos (`ResourceBudgetExceededError`).
4. Exponha a função e os tipos só por `src/index.ts`.
5. Teste ao lado do código (`src/**/*.test.ts`): PDF válido, inválido, criptografado, acima do limite e cancelado.
6. Na ferramenta, traduza cada código novo em en, pt-BR e es (skill `noduct-i18n`).
7. Atualize `docs/architecture/pdf-core-contracts.md`.

## Validação

`npm run check -- architecture`, `npm run check`, depois `npm run verify`.

## Erros comuns

- `architecture-boundary`: DOM, Astro, `workspace-core` ou dependência externa fora da allowlist no core.
- Import estático do motor, inflando a carga inicial.
- Mensagem traduzida dentro do domínio.
