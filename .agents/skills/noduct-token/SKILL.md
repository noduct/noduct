---
name: noduct-token
description: Adiciona ou altera um design token global do Noduct (cor, raio, sombra, z-index, duração, espaçamento) em packages/design-system/src/tokens.css nos temas claro e escuro, com contraste AA. Use quando um valor visual se repete ou quando o Stylelint acusar token-value.
---

# Token

## Pré-condições

- O valor serve a mais de um componente. Mudar token global exige autorização registrada na issue.

## Referência canônica

[tokens.css](../../../packages/design-system/src/tokens.css) e [theme.ts](../../../packages/design-system/src/theme.ts).

## Passos

1. Declare o token com o mesmo nome em três blocos de `tokens.css`: `:root` (claro), `[data-theme='dark']` e `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`.

   ```css
   :root { --color-warning-surface: #fff7ed; }
   [data-theme='dark'] { --color-warning-surface: #3b2412; }
   ```

2. Para cor de texto ou controle, meça o contraste contra o fundo em que aparece: 4.5:1 para texto, 3:1 para borda de controle, nos dois temas.
3. Se o token alimenta `theme-color`, atualize `theme.ts`; `tests/unit/theme-colors.test.ts` confere a paridade.
4. Troque os valores literais dos consumidores por `var(--token)`. Fora dos arquivos de token, custom property só referencia outro token.

## Validação

`npm run check -- css`, depois `npm run verify` (axe nos dois temas).

## Erros comuns

- `token-value`: literal no consumidor ou custom property local com valor literal.
- Token sem o bloco escuro, quebrando contraste no tema escuro.
- `tokens.css` criado em outra pasta para fugir da regra.
