# Changelog

## 0.7.0 — 2026-10-19

Área de Trabalho Local híbrida ([ADR 0006](../../docs/adr/0006-hybrid-local-workspace.md)).

- **Removidos:** `WorkspaceDrawer`, `connectWorkspaceDrawer()`, `bindWorkspaceDrawer()`, `workspace-drawer-runtime` e `shell/HeaderControl.module.css`. Nenhum controle de workspace vai no header.
- `DropZone` aceita `workspace={{ confirmLabel }}`: origem `Da Área Local` com o diálogo `WorkspacePicker` (busca, compatibilidade por `accept`, seleção e confirmação). O controller ganha `select(files, origin)` e `noduct:files` informa `source` e `documentIds`.
- `DownloadCard` aceita `workspace={{ sourceTool }}`: “Salvar na Área Local” opt-in com estados salvando, salvo e falha, mais `setPreview()` e o evento `noduct:download-ready`.
- `ReorderableList` mostra miniaturas por `setThumbnail(id, blob)`.
- Novos `WorkspaceManager` (página `/workspace/`) e `WorkspaceRecents` (home).
- `Select` (combobox “select-only” do WAI-ARIA, com teclado e busca por digitação) e o subpath `@noduct/design-system/controls`.
- `ConfirmDialog` no `AppShell` e `confirmAction()` (`@noduct/design-system/shell/confirm`): substitui `alert`, `confirm` e `prompt` nativos, agora proibidos.
- Página e home da Área Local com ações por ícone (`download`, `hourglass`/`timer-off`, `trash-2`), lista ou grade lembrada, miniaturas sob demanda e lista por chave (sem piscar).
- Ícones novos na allowlist: `download`, `hourglass`, `timer-off`, `layout-grid`, `layout-list`, `triangle-alert`.
- `workspace-ui`: `connectLocalWorkspace()`, `createWorkspaceServices()`, `createWorkspaceSync()`, serviço de miniaturas com fila única, `formatWorkspaceError()` e mensagens en/pt-BR/es.

## 0.6.0 — 2026-10-19

- `connectWorkspaceDrawer()` compartilha a integração do drawer com o cliente injetado por cada ferramenta.
- O conector agrega eventos externos com debounce de `WORKSPACE_SYNC_DEBOUNCE_MS` e lista via `listDocumentSummaries()`, sem ler payloads. `bindWorkspaceDrawer()` recebe um controller já armado.
- Gatilhos de Settings e Workspace compartilham `shell/HeaderControl.module.css`; o rótulo do Workspace usa a `.sr-only` global.
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
