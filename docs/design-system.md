# Design system

## Objetivo

Oferecer identidade consistente sem acoplar as ferramentas ao código do hub. Os tokens canônicos ficam em `packages/design-system/src/tokens.css`.

## Convenções

Azul é reservado a ações e foco; superfícies neutras sustentam conteúdo. Raios variam de 6 a 16 px. O tema escuro troca tokens, não regras por componente. Contraste, foco visível, alvos mínimos de 44 px e `prefers-reduced-motion` são obrigatórios.

## Modificação e validação

A versão `0.2.0` expõe `@tolvira/design-system/sponsorship` com contratos v1, resolver, cliente de atualização e fallback de logo. A API não depende de módulos do Hub nem importa componentes Astro. Consulte [Registry de patrocínios](registry-patrocinio.md). Mudanças de dados centrais dispensam rebuild do consumidor; atualizar o código do pacote exige atualização versionada e deploy das ferramentas.

Altere o token mais semântico possível e teste ambos os temas em mobile e desktop. Rode Playwright com axe. A marca atual é textual com símbolo provisório; substitua por asset oficial sem redesenhá-lo por aproximação.
