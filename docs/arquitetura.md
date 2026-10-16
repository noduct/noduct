# Arquitetura

## Objetivo

Noduct é uma suíte estática de ferramentas client-side. O hub cuida de descoberta e catálogo; ferramentas independentes cuidam do processamento local. Todos os sites usam a mesma origem para compartilhar com segurança controlada o Local Workspace e os tickets de transferência.

## Pacotes e dependências

- `@noduct/tool-runtime`: TypeScript puro e fonte única de topologia, locales, SEO, taxonomia e `defineTool()`;
- `@noduct/design-system`: tokens, shell e componentes acessíveis; depende apenas do runtime entre os pacotes estruturais;
- `@noduct/workspace-core`: persistência IndexedDB, coordenação entre abas e transferências;
- `@noduct/pdf-core`: domínio de processamento PDF, sem DOM;
- ferramentas Astro: compõem shell, componentes e pacotes de domínio.

O runtime não depende de pacote interno. O design system não importa hub nem pacotes de domínio. O hub não importa `pdf-core` ou `workspace-core`. Consumidores usam somente exports públicos.

## Topologia e publicação

O hub ocupa `/`, `/pt-br/` e `/es/`. Cada ferramenta ocupa `/<slug>/`, `/<slug>/pt-br/` e `/<slug>/es/`. `RESERVED_HUB_SEGMENTS` protege o namespace do hub. No monorepo, `scripts/assemble-pages.ts` descobre ferramentas por `noduct.slug`, monta `dist-pages/` e cria stubs transitórios do base antigo.

O catálogo tipado continua sendo a fonte de verdade para disponibilidade. Itens `planned` aparecem como roadmap sem link. HTML essencial é gerado estaticamente; JavaScript é seletivo e processamento de arquivos ocorre localmente.

## Validação

`validate:pages` verifica a correspondência entre topologia e artefato. ADRs 0003 e 0005 registram estratégia de extração, shell e guardrails. A definição completa de pronto é `npm run verify`.
