## Context

A versão `0.8.0` do `@noduct/design-system` unifica a experiência visual e de interação de todo o monorepo Noduct sob o paradigma **Quiet Productivity** ([docs/padroes-interface.md](../../../docs/padroes-interface.md)). Durante a revisão transversal de desktop, tablet e mobile via Chrome DevTools MCP e agentes especializados de UI/UX, foram mapeadas e resolvidas lacunas em sete áreas:

1. **Sistema de Botões (`Button.astro` e `Button.module.css`):** ausência de modo quadrado 1×1 (`iconOnly`) para controles de ícone em listas e cabeçalhos, falta de exportação pública do módulo CSS para `<label>` de inputs de arquivo e ausência de atributos ARIA/HTML (`ariaPressed`, `ariaHaspopup`, `ariaDescribedby`, `title`, `target`, `rel`).
2. **Controle de Alternância (`Switch.astro` e `Switch.module.css`):** extração do switch do menu de configurações para componente reutilizável de primeira classe no design system, com alvo de toque de 44 px, semântica `role="switch"` e propriedade `blocked` (`data-blocked="true"`).
3. **Menus, Listas e Busca em Padrão *Inset Grouped*:** refatoração do `SettingsMenu` (ocultando controles de arte de fundo abaixo de `1400px` onde a `AmbientArtwork` não é renderizada), do menu `Categories` no `SiteHeader` (ancorado à direita `right: 0` para nunca gerar scroll horizontal e sem `border-radius: inherit` no `:focus-visible` global para não perder o arredondamento ao apertar `Shift`), do menu mobile, do `Select` e do `ToolSearch` (`Popover.module.css` com `.body`, `.card`, `.badge` e `overflow: visible` em `.page-head`).
4. **Filtro de Categorias da Biblioteca na Home (`HomePage.astro` e `Home.module.css`):** substituição da barra de âncoras que cortava o 6º item (*Utilitários*) por um `<fieldset>` de pílulas responsivas (`flex-wrap: wrap`) com opção inicial *Todas* (`all`) e filtragem instantânea via CSS `:has()`, mantendo zero bytes extras de JavaScript.
5. **Formatos Livres na Área Local vs. Restrição por Ferramenta (`defineTool`, `contracts.ts`, `WorkspaceManager.astro`):** separação clara entre o armazenamento multiformato da Área Local (`DEFAULT_WORKSPACE_ACCEPT = ''` + `resolveFileMimeType` por extensão) e a restrição declarativa de cada ferramenta (`tool.accept` em `defineTool()`).
6. **Rodapé e Ilha *Buy Me a Coffee* (`SiteFooter.astro` e `Footer.module.css`):** redesign do bloco de apoio voluntário (“Me pague um café”) como ilha elevada com selo âmbar (`--color-warning-soft`, `--color-brand-support`), micro-interação de ícone e seta diagonal `arrow-up-right`.
7. **Alinhamento Responsivo de Cards (`ToolCard`, `WorkspaceRecents`, `SponsorRail`, `ToolPage`, `MergePdfApp`):** adição de `ToolIcon` nos cards de ferramentas, concisão do botão `"Ver todos"` na seção recente da Área Local no mobile, correção do breakpoint e `auto-fit` do `SponsorRail` em telas pequenas e elevação das seções informativas em cards estruturados.

## Goals / Non-Goals

**Goals:**
- Garantir que todas as ações do Hub, ferramentas e Área Local consumam `Button.astro` (ou `Button.module.css` em `<label>` de `input[type=file]`) com `--rim-light-strong` e alvo mínimo de 44×44 px.
- Estabelecer o padrão *Inset Grouped* como linguagem única para menus, dropdowns, seletores e popovers de busca.
- Permitir upload e gestão de múltiplos formatos na Área Local (`/workspace/`), mantendo a restrição de formatos estritamente declarada por ferramenta (`defineTool({ accept })`).
- Preservar 100% de conformidade com todos os guardrails (`css`, `ui`, `i18n`, `architecture`, `agents`, `types`, `unit`) sem tocar em `controlFiles`.

**Non-Goals:**
- Alterar a topologia de URLs (`@noduct/tool-runtime`) ou o protocolo de persistência IndexedDB (`@noduct/workspace-core`).
- Adicionar scripts pesados no cliente da Home (o filtro de categorias opera 100% via CSS `:has()`).

## Decisions

### 1. Arquitetura de dependências respeitada
Seguindo [docs/architecture/README.md](../../../docs/architecture/README.md):
- `@noduct/tool-runtime` define `CATEGORY_DEFAULT_ACCEPT` e a propriedade `accept` em `defineTool()` sem depender de nenhum outro pacote.
- `@noduct/design-system` importa apenas `@noduct/tool-runtime` e expõe `Button`, `Switch`, `Select`, `FILE_ACCEPT`, `DEFAULT_WORKSPACE_ACCEPT` e `resolveFileMimeType`.
- Hub (`src/`) e ferramentas (`packages/merge-pdf`, `packages/tool-template`) consomem apenas os `exports` públicos de `@noduct/tool-runtime` e `@noduct/design-system`.

### 2. Pontos de uso atualizados e código antigo removido
- **`Button` e `Button.module.css`:** adotados em `SiteHeader.astro`, `SettingsMenu.astro`, `SiteFooter.astro`, `ConfirmDialog.astro`, `DropZone.astro`, `DownloadCard.astro`, `ProcessingFeedback.astro`, `ReorderableItemMarkup.astro`, `WorkspaceRecents.astro`, `WorkspaceManager.astro`, `WorkspacePicker.astro`, `HomePage.astro`, `NotFoundPage.astro`, `Contact.astro`, `MergePdfApp.astro` e `ToolDemo.astro`. Classes locais duplicadas de botão foram removidas.
- **`Switch`:** adotado em `SettingsMenu.astro` e exportado em `packages/design-system/package.json` (`./components/Switch.astro`).
- **Filtro de categorias da Home:** removida a grade fixa `repeat(6, minmax(0, 1fr))` e o carrossel horizontal que cortava rótulos em `Home.module.css`, substituídos por `<fieldset>` com inputs de rádio ocultos e seletores `:has()`.

## Risks / Trade-offs

- **[Risco] Regra de indicador único de foco no rodapé e cabeçalho (`audit.spec.ts`):** Os controles `header a:visible, header button:visible, footer a:visible` exigem exatamente 1 indicador de foco (`outline` **ou** `box-shadow`, nunca ambos).
  - **Mitigação:** Removido `border-radius: inherit` de `:focus-visible` em `base.css` e padronizado `outline: none; box-shadow: var(--shadow-focus-footer)` nos links do rodapé e `--shadow-focus-ring` no botão de apoio.
- **[Risco] Inferência de MIME quando o navegador envia `file.type === ""`:** Antes, o fallback `'application/pdf'` fazia arquivos `.txt` ou `.csv` parecerem PDFs no `WorkspacePicker`.
  - **Mitigação:** `resolveFileMimeType` consulta o mapa canônico de extensões antes de usar `application/octet-stream`, garantindo filtragem precisa em todas as ferramentas.
