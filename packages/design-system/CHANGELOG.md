# Changelog

## 0.5.0 — 2026-10-16

- Adicionado `ToolPage` como template único para páginas de ferramentas, com breadcrumb, título, área funcional, patrocínio e conteúdo compartilhados.
- Integrado o `WorkspaceDrawer` ao header do `AppShell`, com controle compacto em telas estreitas.
- Removidos `BrandHeader`, `BrandFooter`, `ToolFrame` e `SponsoredPlacement` da API pública. Ferramentas devem usar `ToolPage`.
- Removido `designPath`; caminhos devem vir de `@noduct/tool-runtime`.

## 0.4.0

- Primitivas de fluxo de arquivos e controles do Local Workspace.
