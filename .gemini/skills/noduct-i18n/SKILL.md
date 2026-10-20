---
name: noduct-i18n
description: Adiciona ou altera texto visível no Noduct em en, pt-BR e es, inclusive em scripts cliente, aria-live, erros traduzidos a partir de códigos e nomes de arquivo gerados. Use sempre que a mudança mostrar texto ao usuário.
---

# Texto i18n

## Pré-condições

- Saiba quem é dono do texto: hub, shell ou ferramenta.

## Referência canônica

| Dono | Arquivo |
| --- | --- |
| Hub | [src/i18n/messages.ts](../../../src/i18n/messages.ts) |
| Shell e componentes compartilhados | [shell/messages.ts](../../../packages/design-system/src/shell/messages.ts) |
| Ferramenta | `packages/<slug>/src/i18n.ts` (ex.: [merge-pdf](../../../packages/merge-pdf/src/i18n.ts)) |

## Passos

1. Acrescente a chave nos três idiomas no arquivo do dono. Parâmetros por placeholder, nunca concatenação:

   ```ts
   removeFile: 'Remover {name}',
   ```

2. Script cliente: serialize só as mensagens do locale atual (`data-*` ou `<script type="application/json">`) e formate números com `Intl.NumberFormat(locale)`.
3. Erro de domínio chega como `code` + `params`; traduza o código na interface, nunca no pacote de domínio.
4. Rótulo acessível contém o texto visível de forma contígua.
5. Teste os três locales quando houver texto novo no fluxo.

## Validação

`npm run check -- i18n`, `npm run check -- ui`, depois `npm run verify`.

## Erros comuns

- `no-hardcoded-text`: literal em atributo, `textContent`, `innerHTML` ou `setAttribute`.
- Anúncio `aria-live`, erro ou nome de arquivo sem tradução.
- Frase montada em `pdf-core` ou `workspace-core`.
