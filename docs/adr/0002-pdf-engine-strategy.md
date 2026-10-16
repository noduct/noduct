# ADR 0002 — Estratégia de motores PDF

**Status:** aceito em 2026-10-16.

## Contexto

As ferramentas PDF precisam processar arquivos localmente em aplicações estáticas,
com custo de rede e memória controlados, sem estabelecer dependência irreversível
de um motor nativo ou de licença copyleft.

## Decisão

Usar `pdf-lib` (MIT) para mutação estrutural e `PDF.js` (Apache-2.0) como
renderer/inspector opcional e carregado sob demanda. Expor ambos apenas por
adaptadores de `pdf-core`; a UI não conhece fornecedores.

## Alternativas rejeitadas

- **B, híbrido JS + WASM agora:** não há ganho medido que pague o payload, a
  inicialização e a complexidade de memória.
- **C, WASM predominante:** PDFium e qpdf exigem uma integração WASM a manter;
  MuPDF introduz AGPL ou custo comercial; `lopdf` ainda exigiria adaptar uma API
  de baixo nível para web.

## Consequências

O preview não pesa na rota de merge sem preview. Uma futura ferramenta pode
adicionar um adaptador WASM mantendo o contrato. M1 deve medir o bundle final,
testar arquivos reais permitidos e preservar avisos de licença no artefato.
