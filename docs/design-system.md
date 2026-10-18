# Design system

## Objetivo

Oferecer identidade consistente sem acoplar as ferramentas ao código do hub. Os tokens canônicos ficam em `packages/design-system/src/tokens.css`.

## Convenções

Azul é reservado a ações e foco; superfícies neutras sustentam conteúdo. Raios variam de 4 a 10 px. O tema escuro troca tokens, não regras por componente. Contraste, foco visível, alvos mínimos de 44 px e `prefers-reduced-motion` são obrigatórios.

## Modificação e validação

A versão `0.5.0` reúne `AppShell` e `ToolPage` para todas as ferramentas, além de `SponsorCard`, `SponsorshipSlot`, `DropZone`, `ReorderableList`, `ProcessingFeedback`, `DownloadCard` e `WorkspaceDrawer`. `ToolPage` fornece breadcrumb, título, área funcional, patrocínio e conteúdo; o drawer entra no slot `actions` do header. O subpath `@noduct/design-system/sponsorship` expõe contratos v1, resolver, cliente de atualização e fallback de logo. Consulte [Componentes de fluxo de arquivos](componentes-fluxo-arquivos.md) e [Registry de patrocínios](registry-patrocinio.md). Mudanças de código ou estilos exigem versão e deploy dos consumidores. O histórico da API está no [changelog](../packages/design-system/CHANGELOG.md).

Altere o token mais semântico possível e teste ambos os temas em mobile e desktop. Rode Playwright com axe. O monograma `N` do shell é a referência de marca.

Para mudanças recorrentes, siga as receitas de [componente](agentes/receitas/componente-design-system.md), [ícone](agentes/receitas/icone.md) e [token](agentes/receitas/token.md). `npm run check` aplica os guardrails de CSS, ícones e shell; `npm run verify` valida o artefato e a paridade com o hub. A [matriz de guardrails](guardrails.md) registra o reparo de cada falha.
