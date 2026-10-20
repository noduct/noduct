---
name: noduct-hub-route
description: Adiciona uma página ou rota nova ao hub do Noduct (src/pages) nos três idiomas, reservando o segmento na topologia, com AppShell, canonical, hreflang, um H1 e JSON-LD. Use para páginas institucionais, de categoria ou de gestão no hub.
---

# Rota do hub

## Pré-condições

- O primeiro segmento da URL não é slug de ferramenta nem locale.

## Referência canônica

[workspace.astro](../../../src/pages/workspace.astro), a entrada `workspace` em [`[locale]/[slug].astro`](../../../src/pages/[locale]/[slug].astro) e [topology](../../../packages/tool-runtime/src/topology.ts).

## Passos

1. Reserve o segmento em `RESERVED_HUB_SEGMENTS` (`packages/tool-runtime/src/topology.ts`) e cubra em `topology.test.ts`.
2. Crie o corpo em `src/components/pages/<Nome>Page.astro`, compondo `AppShell` com title, description, `path` e um único JSON-LD.
3. Rota en: `src/pages/<segmento>.astro` só renderiza o corpo com `locale="en"`. Rotas pt-BR e es: acrescente a entrada em `getStaticPaths` de `src/pages/[locale]/[slug].astro`.
4. Links para a rota vêm de `topology.hubUrl('<segmento>/', locale)`.
5. Inclua a rota em `tests/e2e/audit.spec.ts` (`routes`).

## Validação

`npm run check`, `npm run build`, `npm run check -- pages`, `npm run check -- seo`, depois `npm run verify`.

## Erros comuns

- `require-app-shell`: página sem `AppShell`.
- `ui-contract`: URL do produto escrita à mão.
- H1 ausente ou duplicado, canonical ou hreflang faltando, segmento não reservado.
