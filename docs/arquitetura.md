# Arquitetura

## Objetivo

Separar descoberta, identidade e governança no hub de cada motor de ferramenta. O hub é um site Astro totalmente estático; cada ferramenta futura é outro site Astro em seu próprio project site.

## Decisões

`src/data/tools.ts` é a fonte de verdade. Páginas, busca e categorias derivam dela. Itens `planned` aparecem apenas como roadmap sem link; `beta` e `published` exigem URL real. O HTML essencial é gerado no build e o JavaScript do navegador se restringe a busca, menu e tema.

O workspace contém pacotes extraíveis. `packages/design-system` concentra tokens; `packages/tool-template` comprova o contrato de uma aplicação independente. Consulte `estrutura-repositorios.md` para separar os pacotes.

Componentes do hub adotam CSS Modules como convenção principal. `styles/tokens.css`, `styles/themes.css` e `styles/global.css` permanecem globais por tratarem de fundações transversais. `features/` expõe fronteiras funcionais de busca e catálogo; páginas devem se limitar à composição. As regras permanentes para agentes estão em `AGENTS.md`.

## Validação e limitações

Execute `npm run validate`. O hub não executa processamento de arquivos e não possui backend. Disponibilidade de uma ferramenta depende do respectivo repositório e deploy.
