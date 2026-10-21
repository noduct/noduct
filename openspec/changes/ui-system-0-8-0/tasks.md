## 1. Componentes Base do Design System (`Button`, `Switch`, `Select`)

- [x] 1.1 Evoluir `packages/design-system/src/components/Button.astro` e `packages/design-system/src/components/Button.module.css` com suporte a `iconOnly` (proporção 1×1), variantes (`primary`, `secondary`, `quiet`, `danger`, `danger-quiet`), `--rim-light-strong`, atributos ARIA/HTML completos e exportação pública em `packages/design-system/package.json`. Validar com `npx vitest run tests/unit/button.test.ts`.
- [x] 1.2 Criar `packages/design-system/src/components/Switch.astro` e `packages/design-system/src/components/Switch.module.css` com `role="switch"`, alvo de toque de 44 px e estado `blocked` (`data-blocked="true"`), adotando-o em `packages/design-system/src/shell/SettingsMenu.astro` e `packages/design-system/src/shell/preferences.ts`. Validar com `npm run check -- ui`.

## 2. Shell, Menus *Inset Grouped*, Busca e Rodapé (*Buy Me a Coffee*)

- [x] 2.1 Refinar `packages/design-system/src/shell/SettingsMenu.module.css`, `packages/design-system/src/shell/Header.module.css`, `packages/design-system/src/components/Select.module.css`, `packages/design-system/src/shell/Popover.module.css` e `packages/design-system/src/base.css` no padrão *Inset Grouped*, ocultando controles de arte abaixo de `1400px`, ancorando o dropdown de categorias com `right: 0`, corrigindo o foco arredondado ao pressionar `Shift` e o posicionamento do `ToolSearch` em `/tools/`. Validar com `npm run check -- css`.
- [x] 2.2 Redesenhar `packages/design-system/src/shell/SiteFooter.astro`, `packages/design-system/src/shell/Footer.module.css` e `packages/design-system/src/shell/messages.ts` com a ilha de apoio *Buy Me a Coffee* (“Me pague um café”), selo âmbar (`--color-warning-soft`, `--color-brand-support`) e seta externa `arrow-up-right`. Validar com `npm run check -- i18n`.

## 3. Área de Trabalho Local Multiformato e Restrição por Ferramenta

- [x] 3.1 Adicionar `CATEGORY_DEFAULT_ACCEPT` e propriedade `accept` em `packages/tool-runtime/src/define-tool.ts`, e `FILE_ACCEPT`, `DEFAULT_WORKSPACE_ACCEPT` e `resolveFileMimeType` em `packages/design-system/src/file-workflow/contracts.ts`. Atualizar `packages/design-system/src/components/WorkspaceManager.astro`, `packages/design-system/src/workspace-ui/manager-runtime.ts`, `packages/design-system/src/workspace-ui/connect.ts`, `packages/design-system/src/workspace-ui/messages.ts`, `packages/workspace-core/src/db.ts`, `packages/merge-pdf/src/config.ts`, `packages/merge-pdf/src/components/MergePdfApp.astro`, `packages/tool-template/src/config.ts` e `packages/tool-template/src/components/ToolDemo.astro`. Validar com `npx vitest run tests/unit/file-workflow.test.ts packages/tool-runtime/src/topology.test.ts`.

## 4. Hub, Filtro de Categorias da Home, Cards e Documentação

- [x] 4.1 Implementar o filtro de categorias responsivo sem JavaScript em `src/components/pages/HomePage.astro`, `src/pages/Home.module.css` e `src/i18n/messages.ts`, ajustar `WorkspaceRecents.module.css` (`"Ver todos"` no mobile) e corrigir o grid responsivo do `src/components/sponsors/SponsorRail.astro`. Validar com `npm run check -- css`.
- [x] 4.2 Atualizar o changelog `packages/design-system/CHANGELOG.md` (`0.8.0`), as specs vivas em `openspec/specs/` e a documentação em `docs/padroes-interface.md`, `docs/design-system.md`, `docs/componentes-fluxo-arquivos.md`, `docs/criar-nova-ferramenta.md`, `docs/agentes/openspec.md` e `.agents/skills/noduct-new-tool/SKILL.md`. Validar com `npx openspec validate ui-system-0-8-0 --strict` e `npm run check -- agents`.
