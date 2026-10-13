# ADR 0001 — Hub estático e ferramentas independentes

**Status:** aceito em 2026-10-13.

## Contexto

O ecossistema precisa crescer em dezenas de utilitários, mantendo baixo custo, bom HTML e falhas isoladas. O hub não precisa processar dados.

## Decisão

Usar Astro estático no hub e em cada project site, com manifesto central somente para descoberta. Ferramentas vivem em repositórios e deploys independentes. Um pacote de tokens e um template reduzem divergência.

## Consequências

Cada ferramenta mantém dependências, sitemap e release. Alterações compartilhadas não se propagam automaticamente até atualização de versão. Em troca, uma ferramenta pesada ou com falha não compromete as demais, e o hub permanece simples.
