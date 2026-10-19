# Changelog

## 0.6.0 — 2026-10-19

- `connectWorkspaceDrawer()` compartilha a integração do drawer com o cliente injetado por cada ferramenta.
- Rótulos, tamanhos e anúncios do drawer respeitam o idioma da página.
- `toolJsonLd()` usa a mesma lista de breadcrumb da página visível.
- Removido o export público sem consumidores de `ScrollArea`.
- Removida a prop sem consumidores `compact` do `WorkspaceDrawer`; o modo compacto continua responsivo.

## 0.5.0 — 2026-10-17

- Adicionados `shell/*`, `ToolPage`, `icons/*`, `base.css` e tokens compartilhados com o hub.
- Integrado o `WorkspaceDrawer` ao slot `actions` do header, com controle compacto em telas estreitas.
- Removidos `BrandHeader`, `BrandFooter`, `ToolFrame`, `SponsoredPlacement`, `designPath`, `DesignLocale` e o export público de `SeoHead`.
- O breadcrumb visual e o JSON-LD das ferramentas usam `toolBreadcrumbItems()`; o rodapé recebe o mesmo destino de apoio público em hub e ferramentas.

### Migração

Envolva a página em `AppShell` e componha `ToolPage` dentro dele. Passe o manifesto de `defineTool()` para `ToolPage`, coloque `WorkspaceDrawer` no slot `actions` do `AppShell` e use `@noduct/tool-runtime` para `Locale`, URLs e JSON-LD. Importe `ToolPage` de `@noduct/design-system/shell/ToolPage.astro`; `SeoHead` é interno ao shell.

## 0.4.0

- Primitivas de fluxo de arquivos e controles do Local Workspace.
