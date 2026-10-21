# Changelog

## 0.8.0 — 2026-10-20

- `Button` público unifica ações com texto, links apresentados como botões e controles de ícone em proporção 1x1 (`iconOnly`) em cinco variantes (`primary`, `secondary`, `quiet`, `danger`, `danger-quiet`) e três tamanhos (`sm`, `md`, `lg`), com suporte completo a atributos ARIA/HTML (`ariaPressed`, `ariaDescribedby`, `ariaHaspopup`, `title`, `target`, `rel`, `download`) e exportação pública de `./components/Button.module.css`.
- Novos tokens `--color-action-primary`, `--color-action-danger` e respectivos `-hover`: fundos sólidos com texto branco AA nos dois temas (no escuro, o azul e o vermelho das ações ficam mais fechados que `--color-primary` e `--color-danger`).
- Variantes elevadas usam o novo token `--rim-light-strong` (0,7 no claro, 0,24 no escuro), mais visível que o `--rim-light` das superfícies; foco, estado desabilitado, movimento reduzido e alvo de toque seguem o mesmo contrato.
- Hub, Merge PDF, componentes de arquivo (`DropZone`, `ReorderableList`, `ProcessingFeedback`, `DownloadCard`), Área Local (`WorkspaceRecents` incluindo o botão “Abrir a Área de Trabalho”, `WorkspaceManager`, `WorkspacePicker`), diálogo de confirmação, shell (`SiteHeader`, `SettingsMenu`, `SiteFooter`) e template de ferramenta adotam o componente. Labels de arquivo e ações dinâmicas reutilizam suas classes de estilo.
- `Switch` público (`@noduct/design-system/components/Switch.astro`): controle de alternância acessível (WAI-ARIA `role="switch"`, `aria-checked`) com alvo de toque de 44 px (WCAG AA), suporte a `blocked` e `disabled`, e adoção no menu de configurações do shell (com bloqueio automático de redução de movimento quando a arte de fundo está desativada e ocultação responsiva das opções de arte abaixo de `1400px`).
- Mesa de Montagem 2D e componentes de fluxo de arquivo atualizados: `DropZone` ganha modo compacto via `dropZone.setCompact(bool)` mantendo as duas origens (dispositivo e Área Local) visíveis e acessíveis; `ReorderableList` ganha prop `variant` (`"list"` | `"grid"`), cabeçalho de cartão integrado com posição numérica, miniatura A4 de 105×148 px e setas horizontais. O arrasto 2D acompanha o ponteiro e reorganiza os cartões em tempo real, usando posições fixadas no início do gesto para evitar oscilação; ao cancelar, a ordem inicial é restaurada. Novo token `--z-sticky: 15` para barras de comando de ferramentas sem sobrepor o cabeçalho nem o menu de configurações.
- Redesign _Inset Grouped_ e polimento estético global: `SettingsMenu`, dropdown de `Categories` (com ancoragem `right: 0` responsiva e cantos arredondados preservados no foco por teclado), menu mobile do `SiteHeader`, `Select`, `ToolSearch` (`Popover.module.css` com `.body`, `.card` e `.badge`), `ToolCard` (com `ToolIcon` no cabeçalho e diferenciação visual de ferramentas planejadas), cabeçalhos `.page-head`, tipografia editorial `.prose`, `SiteFooter` (card de apoio _Buy Me a Coffee_ / “Me pague um café” com selo âmbar `--color-warning-soft` e micro-interação de ícone) e layout de `ToolPage` / `MergePdfApp` (seções informativas em cards estruturados e correção do posicionamento do autocomplete da busca na página `/tools/`).
- Filtro de categorias na biblioteca da Home (`HomePage.astro` e `Home.module.css`): substituída a barra de âncoras que cortava rótulos por pílulas responsivas (`flex-wrap`) com opção “Todas” (`all`) e filtragem instantânea via CSS `:has()`, sem custo de JavaScript e com suporte completo a teclado e toque (44 px).
- Seleção livre de formatos na Área de Trabalho Local (`DEFAULT_WORKSPACE_ACCEPT`, `FILE_ACCEPT` e `resolveFileMimeType`) combinada com declaração limpa de formatos aceitos por ferramenta em `defineTool({ accept })`: `/workspace/` aceita múltiplos formatos com inferência de MIME pela extensão, enquanto cada ferramenta restringe seus arquivos aceitos na `DropZone` e no `WorkspacePicker`.
- Minimização com persistência em `localStorage` (`noduct-workspace-recents`) na seção de acesso rápido da Home (`WorkspaceRecents`): botão `iconOnly` (`chevron-down`) com hidratação sem FOUC via `AppShell.astro` (`html[data-workspace-recents='collapsed']`), contador tabular em pílula e botão de ação fixo como `"Ver todos"` em `pt-BR` e `es`.

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

- `DownloadCard` passou de link com `download` para botão que cria um Object URL local no clique. Isso permite controlar o ciclo de vida do arquivo sem navegação; consumidores e testes devem procurar o botão e confirmar o download `blob:`.
- Adicionados `shell/*`, `ToolPage`, `icons/*`, `base.css` e tokens compartilhados com o hub.
- Integrado o `WorkspaceDrawer` ao slot `actions` do header, com controle compacto em telas estreitas.
- Removidos `BrandHeader`, `BrandFooter`, `ToolFrame`, `SponsoredPlacement`, `designPath`, `DesignLocale` e o export público de `SeoHead`.
- O breadcrumb visual e o JSON-LD das ferramentas usam `toolBreadcrumbItems()`; o rodapé recebe o mesmo destino de apoio público em hub e ferramentas.

### Migração

Envolva a página em `AppShell` e componha `ToolPage` dentro dele. Passe o manifesto de `defineTool()` para `ToolPage`, coloque `WorkspaceDrawer` no slot `actions` do `AppShell` e use `@noduct/tool-runtime` para `Locale`, URLs e JSON-LD. Importe `ToolPage` de `@noduct/design-system/shell/ToolPage.astro`; `SeoHead` é interno ao shell.

## 0.4.0

- Primitivas de fluxo de arquivos e controles do Local Workspace.
