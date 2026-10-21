---
name: noduct-e2e-test
description: Escreve testes end-to-end Playwright do Noduct sobre o artefato dist-pages, com axe nos dois temas, três idiomas, teclado e asserções web-first. Use ao cobrir um fluxo de ferramenta, página do hub ou componente compartilhado.
---

# Teste e2e

## Pré-condições

- Existe um comportamento observável a provar e o artefato foi gerado com `npm run build`.

## Referência canônica

[merge-pdf.spec.ts](../../../tests/e2e/merge-pdf.spec.ts), [audit.spec.ts](../../../tests/e2e/audit.spec.ts) e [shell-parity.spec.ts](../../../tests/e2e/shell-parity.spec.ts).

## Passos

1. Escreva o fluxo real no spec da ferramenta ou da página; URLs via `topology`.
2. Use localizadores por papel e nome e asserções que esperam sozinhas:

   ```ts
   await expect(page.getByRole('alert')).toHaveText(m.errorEncrypted);
   ```

3. Cubra teclado, foco e os dois temas; rode axe com `AxeBuilder` nos estados abertos relevantes.
4. Texto novo: confira en, pt-BR e es.
5. Privacidade: prove que o download é local (URL `blob:`) e que nenhuma requisição leva o arquivo.
6. Ferramenta nova entra na paridade automaticamente; não edite a lista.

## Validação

`npm run build`, `npm run test:e2e`, depois `npm run verify`. Diferença em `shell-parity` é defeito a corrigir, não baseline a regravar.

## Erros comuns

- `waitForTimeout` ou seletor por classe gerada.
- `ratchet`: `.skip`, `.fixme`, `.only` ou asserção afrouxada.
- Teste só em um tema ou só em inglês.
