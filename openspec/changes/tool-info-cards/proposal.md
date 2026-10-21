## Why

A issue #39 define o Merge PDF como referência das ferramentas. Os três cards abaixo da área funcional ainda eram texto corrido, sem hierarquia, e o template divergia (terceiro card de “ferramentas relacionadas”). Toda ferramenta precisa do mesmo fluxo de leitura: um guia próprio e dois cards institucionais iguais.

## What Changes

- O primeiro card passa a ser o guia da ferramenta, em linguagem simples, com listas, **recursos do sistema** em destaque e o rótulo da ação em `código`.
- Os cards **Limites** e **Privacidade** ficam compartilhados (`ToolSharedInfo`) e iguais em Merge PDF, template e ferramentas geradas.
- Um `ToolInfoCard` no design system substitui o CSS local duplicado.

**Pacotes:** `@noduct/design-system`, `@noduct/merge-pdf`, `packages/tool-template`, `scripts/cli/new-tool.ts`.

**Contrato:** itens 1 (shell/`ToolPage`), 5 (tokens e componente compartilhado), 6 (i18n em, pt-BR e es).

## Capabilities

### New Capabilities
- `design-system`: cards informativos da página de ferramenta (`ToolInfoCard`, texto rico e cards compartilhados de limites e privacidade).

### Modified Capabilities
- `tool-shell`: o slot `content` de `ToolPage` passa a ter um guia específico e dois cards institucionais estáveis.

## Impact

- Ferramentas novas herdam o padrão pelo template e pelo `new:tool`.
- Limites continuam interpolados a partir do orçamento de recursos, sem o design system importar `workspace-core`.
