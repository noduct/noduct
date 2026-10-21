# Design system

## Objetivo

Oferecer identidade consistente sem acoplar as ferramentas ao código do hub. Os tokens canônicos ficam em `packages/design-system/src/tokens.css`.

## Convenções

Azul é reservado a ações e foco; superfícies neutras sustentam conteúdo. Raios variam de 4 a 10 px. O tema escuro troca tokens, não regras por componente. Contraste, foco visível, alvos mínimos de 44 px e `prefers-reduced-motion` são obrigatórios.

## Modificação e validação

A versão `0.8.0` reúne `AppShell` (`SiteHeader`, `SettingsMenu`, `SiteFooter`, `ConfirmDialog`) e `ToolPage` para todas as ferramentas, além de `Button` (com variantes `primary`, `secondary`, `quiet`, `danger`, `danger-quiet`, tamanhos `sm`/`md`/`lg`, modo quadrado 1×1 `iconOnly` e `--rim-light-strong`), `Switch` (com estado `blocked`), `Select` (WAI-ARIA select-only combobox *Inset Grouped*), `SponsorCard`, `SponsorshipSlot`, `DropZone`, `ReorderableList`, `ProcessingFeedback`, `DownloadCard`, `WorkspaceManager`, `WorkspacePicker`, `WorkspaceRecents`, `ToolInfoCard` e `ToolSharedInfo`. `ToolPage` fornece breadcrumb, título, área funcional, patrocínio e conteúdo; a Área de Trabalho Local é híbrida, não tem entrada no header ([ADR 0006](adr/0006-hybrid-local-workspace.md)) e aceita formatos livres em `/workspace/` (`DEFAULT_WORKSPACE_ACCEPT`, `FILE_ACCEPT` e `resolveFileMimeType` em `@noduct/design-system/file-workflow`), enquanto cada ferramenta restringe os formatos aceitos via `defineTool({ accept })`. O subpath `@noduct/design-system/sponsorship` expõe contratos v1, resolver, cliente de atualização e fallback de logo. Consulte [Componentes de fluxo de arquivos](componentes-fluxo-arquivos.md), [Padrões de interface](padroes-interface.md) e [Registry de patrocínio](registry-patrocinio.md). Mudanças de código ou estilos exigem versão e deploy dos consumidores. O histórico da API está no [changelog](../packages/design-system/CHANGELOG.md).

Altere o token mais semântico possível e teste ambos os temas em mobile e desktop. Rode Playwright com axe. O monograma `N` do shell é a referência de marca.

Para mudanças recorrentes, siga as skills [noduct-component](../.agents/skills/noduct-component/SKILL.md), [noduct-icon](../.agents/skills/noduct-icon/SKILL.md) e [noduct-token](../.agents/skills/noduct-token/SKILL.md). `npm run check` aplica os guardrails de CSS, ícones e shell; `npm run verify` valida o artefato e a paridade com o hub. A [matriz de guardrails](guardrails.md) registra o reparo de cada falha.
