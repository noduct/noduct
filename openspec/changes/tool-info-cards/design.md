## Contexto

Os três cards da tela Merge PDF vivem no slot `content` de `ToolPage`. O CSS `.infoSection` / `.info` estava duplicado. O card 1 é o guia; 2 e 3 devem ser iguais em toda ferramenta. `.prose` do hub não cabe no grid estreito.

## Decisões

1. **Componente, não classe global.** `ToolInfoCard` no design system, adotado em Merge PDF e no template; CSS local removido.
2. **Texto rico sem `set:html`.** Mensagens usam `**termo**` e `` `ação` ``; `parseRichText` emite nós `<strong>` e `<code>`.
3. **Limites injetados.** `ToolSharedInfo` recebe números; a ferramenta lê `DESKTOP_RESOURCE_BUDGET` / `MOBILE_RESOURCE_BUDGET`. O design system não importa `workspace-core`.
4. **Nota de senha no guia.** Proteção por senha é específica de PDF e fica no primeiro card do Merge PDF, não no card compartilhado de limites.

## Pontos de uso

- `packages/merge-pdf/src/components/MergePdfApp.astro`
- `packages/tool-template/src/components/ToolDemo.astro`
- `scripts/cli/new-tool.ts` (i18n gerado só com o guia)

## Código antigo a remover

- `.infoSection` em `MergePdfApp.module.css`
- `.info` em `ToolDemo.module.css`
- chaves `limits*` / `security*` do Merge PDF e `related*` do template
