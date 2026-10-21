## Why

A evolução estética e ergonômica da versão `0.8.0` do `@noduct/design-system` consolida a linguagem visual **Quiet Productivity** (inspirada em Apple HIG, Linear e Raycast) em todas as superfícies do ecossistema Noduct (Hub, ferramentas independentes e Área de Trabalho Local), eliminando inconsistências visuais e estruturais identificadas em desktop, tablet e mobile (#39):

1. **Sistema unificado de botões e controles de alternância:** ações com texto, links estilizados como botão e botões de ícone 1×1 precisavam de um contrato único (`Button.astro` com `iconOnly` e `--rim-light-strong`) e de um controle de alternância acessível (`Switch.astro` com estado `blocked`).
2. **Menus, seletores e busca em padrão *Inset Grouped*:** o menu de configurações (`SettingsMenu`), o dropdown de `Categories` no cabeçalho, o menu mobile, o `Select` e o autocomplete do `ToolSearch` precisavam de separação clara por grupos rebaixados, posicionamento seguro dentro da viewport e preservação de cantos arredondados no foco por teclado.
3. **Filtro de categorias fluido na Home e alinhamento responsivo de patrocínios:** a barra de categorias na biblioteca da Home cortava o 6º item em viewports intermediárias e apenas navegava por âncora em vez de filtrar; o `SponsorRail` espremia o card único em metade da tela abaixo de `1060px`.
4. **Formatos livres na Área Local vs. restrição limpa por ferramenta:** a página `/workspace/` restringia o seletor de arquivos a `.pdf` e rotulava arquivos sem MIME como `application/pdf`, quando deveria aceitar formatos livres na Área Local e delegar a restrição `accept` à declaração de cada ferramenta (`defineTool({ accept })`).
5. **Rodapé e apoio voluntário (*Buy Me a Coffee*):** o bloco “Me pague um café” precisava de apresentação acolhedora em ilha elevada com selo âmbar semântico (`--color-warning-soft`, `--color-brand-support`) e paridade total entre Hub e ferramentas.

## What Changes

- **Pacotes e superfícies afetados:** `@noduct/tool-runtime`, `@noduct/design-system`, `@noduct/workspace-core`, `@noduct/merge-pdf`, `packages/tool-template` e Hub (`src/`).
- **Itens do Contrato de conformidade do [AGENTS.md](../../../AGENTS.md) atendidos:**
  - **1. Shell:** `AppShell`, `SiteHeader`, `SettingsMenu`, `SiteFooter` e `ToolPage` compartilhados com paridade visual e estrutural entre Hub e ferramentas.
  - **2. Workspace ([ADR 0006](../../../docs/adr/0006-hybrid-local-workspace.md)):** `WorkspaceManager` com formatos livres (`DEFAULT_WORKSPACE_ACCEPT`) e inferência de MIME por extensão (`resolveFileMimeType`); restrição de formatos declarada por ferramenta em `defineTool({ accept })` e aplicada na `DropZone` e no `WorkspacePicker`.
  - **4. Ícones:** uso exclusivo de `Icon` / `IconSprite` a partir da allowlist `registry.ts`.
  - **5. Tokens e componentes:** adoção universal de `Button` (incluindo `iconOnly` 1×1 e `--rim-light-strong`), `Switch` (com `blocked`), `Select` e `ToolSearch` (*Inset Grouped*).
  - **6. i18n:** mensagens completas em `en`, `pt-BR` e `es` (incluindo `allCategories`, `viewAll` conciso no mobile e convite *Buy Me a Coffee* / *Me pague um café* / *Invítame a un café*).
  - **9. Acessibilidade:** WCAG 2.1 AA, alvos mínimos de 44×44 px, indicador de foco único e respeito a `prefers-reduced-motion`.

## Capabilities

### New Capabilities
- `design-system`: Contratos observáveis dos componentes compartilhados (`Button` incluindo modo 1×1 `iconOnly`, `Switch` com estado `blocked`, listas e popovers *Inset Grouped* em `Select` e `ToolSearch`, e filtro de categorias sem JavaScript na Home).

### Modified Capabilities
- `tool-shell`: Incorpora o comportamento adaptativo do `SettingsMenu` (`Switch` bloqueado quando a arte de fundo está desligada e ocultação dos controles de arte abaixo de `1400px`), o posicionamento seguro e foco arredondado do menu de `Categories` e a ilha de apoio voluntário no `SiteFooter`.
- `local-workspace`: Define a seleção livre de formatos na página `/workspace/` com inferência de MIME pela extensão do arquivo e a filtragem declarativa de formatos aceitos por ferramenta (`defineTool({ accept })`) na `DropZone` e no `WorkspacePicker`.

## Impact

- **`packages/tool-runtime`:** `defineTool()` passa a expor `accept` em `ToolManifest` com padrão automático por categoria (`CATEGORY_DEFAULT_ACCEPT`).
- **`packages/design-system`:** evolução dos componentes `Button`, `Switch`, `Select`, `WorkspaceManager`, `WorkspaceRecents`, `WorkspacePicker`, `ReorderableList`, `DropZone`, `DownloadCard`, `SiteHeader`, `SettingsMenu`, `SiteFooter` e `ToolPage`, documentados em `CHANGELOG.md` sob a versão `0.8.0`.
- **`packages/workspace-core`:** fallback de `mimeType` em `dbPutDocument` preserva a extensão real sem rotular arquivos não-PDF como `application/pdf`.
- **Hub (`src/`) e ferramentas (`packages/merge-pdf`, `packages/tool-template`):** adoção integral dos componentes, filtro de categorias responsivo na Home, `ToolCard` com `ToolIcon` e `SponsorRail` alinhado em todas as larguras de tela.
